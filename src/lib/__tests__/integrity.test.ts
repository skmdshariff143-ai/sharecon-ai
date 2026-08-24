import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../engine/matcher';
import {
  evaluateReconciliation,
  simulatePolicyThresholds,
  runMultiSeedBenchmark,
} from '../engine/evaluator';
import { applyReviewerDecision } from '../engine/operations';
import {
  Payment,
  Settlement,
  BankTransaction,
  STANDARD_POLICY_PROFILES,
} from '@/types/reconciliation';

describe('Fintech Metric Integrity & Canonical Evaluation Suite', () => {
  it('guarantees identical results between default baseline and default full-engine simulation', () => {
    const dataset = generateSyntheticDataset(42);
    const start = performance.now();
    const baseResult = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const duration = performance.now() - start;
    const baseEval = evaluateReconciliation(baseResult.records, dataset.groundTruth, duration);

    const simResult = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      85,
      50,
      DEFAULT_ENGINE_CONFIG
    );

    // Exact count parity
    expect(simResult.autoReconciledCount).toBe(baseEval.autoReconciledCount);
    expect(simResult.autoReconciledCount).toBe(111);
    expect(simResult.reviewCount).toBe(baseEval.manualReviewCount);
    expect(simResult.reviewCount).toBe(39);
    expect(simResult.exceptionCount).toBe(baseEval.exceptionCount);
    expect(simResult.exceptionCount).toBe(30);

    // Exact rate and precision parity
    expect(simResult.autoReconciliationRate).toBe(baseEval.autoReconciliationRate);
    expect(simResult.autoResolutionPrecision).toBe(baseEval.autoResolutionPrecision);
    expect(simResult.autoResolutionPrecision).toBe(1.0);
    expect(simResult.autoResolutionRecall).toBe(baseEval.autoResolutionRecall);
    expect(simResult.autoResolutionRecall).toBe(1.0);
    expect(simResult.reviewRoutingAccuracy).toBe(baseEval.reviewRoutingAccuracy);

    // Exact financial safety parity (zero false-positive risk)
    expect(simResult.falsePositiveCount).toBe(0);
    expect(simResult.falsePositiveExposurePaise).toBe(0);
    expect(baseEval.falsePositiveExposurePaise).toBe(0);
  });

  it('preserves baseline benchmark immutability after human reviewer actions', () => {
    const dataset = generateSyntheticDataset(42);
    const baseResult = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const initialEval = evaluateReconciliation(baseResult.records, dataset.groundTruth);
    const initialAutoCount = initialEval.autoReconciledCount;
    const initialReviewCount = initialEval.manualReviewCount;

    // Finance controller approves a pending review item
    const pendingRecord = baseResult.records.find((r) => r.status === 'PENDING_REVIEW')!;
    expect(pendingRecord).toBeDefined();

    const decisionResult = applyReviewerDecision(
      baseResult.records,
      baseResult.auditEvents,
      pendingRecord.recordId,
      'APPROVED',
      'Finance Lead Auditor',
      'Manual verification of bank receipt'
    );

    expect(decisionResult.modifiedRecord?.status).toBe('MANUALLY_APPROVED');

    // Live session records have changed:
    const liveApprovedCount = decisionResult.updatedRecords.filter(
      (r) => r.status === 'MANUALLY_APPROVED'
    ).length;
    expect(liveApprovedCount).toBe(1);

    // But the stored initialEval baseline remains strictly unchanged:
    expect(initialEval.autoReconciledCount).toBe(initialAutoCount);
    expect(initialEval.manualReviewCount).toBe(initialReviewCount);
    expect(initialEval.autoResolutionPrecision).toBe(1.0);
  });

  it('enforces validation and rejects invalid threshold configurations', () => {
    const dataset = generateSyntheticDataset(42);

    // 1. High threshold out of bounds (> 100)
    const resOver100 = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      105,
      50
    );
    expect(resOver100.isValid).toBe(false);
    expect(resOver100.validationError).toBeDefined();

    // 2. High threshold out of bounds (< 50)
    const resUnder50 = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      45,
      30
    );
    expect(resUnder50.isValid).toBe(false);

    // 3. Medium threshold out of bounds (< 20)
    const resMedUnder20 = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      85,
      15
    );
    expect(resMedUnder20.isValid).toBe(false);

    // 4. Inverted threshold ordering: Medium > High
    const resInverted = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      60,
      80
    );
    expect(resInverted.isValid).toBe(false);
  });

  it('correctly evaluates all standard policy profiles and multi-seed benchmark', () => {
    const dataset = generateSyntheticDataset(42);

    expect(STANDARD_POLICY_PROFILES.length).toBe(4);

    STANDARD_POLICY_PROFILES.forEach((policy) => {
      const res = simulatePolicyThresholds(
        dataset.payments,
        dataset.settlements,
        dataset.bankTransactions,
        dataset.groundTruth,
        policy.highThreshold,
        policy.mediumThreshold
      );

      expect(res.isValid).toBe(true);
      expect(res.autoResolutionPrecision).toBe(1.0);
      expect(res.falsePositiveExposurePaise).toBe(0);
      expect(res.autoReconciledCount).toBeGreaterThanOrEqual(100);
    });

    const seeds = [42, 101, 777, 2024, 9999];
    const multiSeedResults = runMultiSeedBenchmark(seeds);

    expect(multiSeedResults.length).toBe(5);
    multiSeedResults.forEach((s) => {
      expect(s.totalRecords).toBe(180);
      expect(s.autoResolutionPrecision).toBe(1.0);
      expect(s.autoResolutionRecall).toBe(1.0);
      expect(s.falsePositiveExposurePaise).toBe(0);
      expect(s.proposedPairPrecision).toBeGreaterThan(0.85);
      expect(s.proposedPairRecall).toBeGreaterThan(0.9);
      expect(s.reviewRoutingAccuracy).toBeGreaterThan(0.75);
    });
  });
});

describe('Adversarial Edge-Case Engine Audits', () => {
  it('prevents auto-reconciliation on duplicate settlement collisions', () => {
    const payment: Payment = {
      paymentId: 'pay_collision_001',
      orderId: 'order_col_001',
      grossAmount: 100000,
      fee: 2000,
      tax: 360,
      expectedNetAmount: 97640,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    // Two identical settlements for the same payment reference
    const settlementA: Settlement = {
      settlementId: 'set_dup_A',
      paymentReference: 'pay_collision_001',
      settledAmount: 97640,
      utr: 'UTRCOLLISION001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };
    const settlementB: Settlement = {
      settlementId: 'set_dup_B',
      paymentReference: 'pay_collision_001',
      settledAmount: 97640,
      utr: 'UTRCOLLISION001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_col_001',
      utr: 'UTRCOLLISION001',
      creditAmount: 97640,
      description: 'Razorpay payout pay_collision_001',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlementA, settlementB], [bankTx]);
    expect(result.records.length).toBe(1);

    const rec = result.records[0];
    expect(rec.status).not.toBe('AUTO_RECONCILED');
    expect(rec.exceptionType).toBe('DUPLICATE_SETTLEMENT');
    expect(rec.confidence).toBeLessThanOrEqual(65);
  });

  it('prevents auto-reconciliation on duplicate bank-credit collisions', () => {
    const payment: Payment = {
      paymentId: 'pay_bankcol_001',
      orderId: 'order_bankcol_001',
      grossAmount: 50000,
      fee: 1000,
      tax: 180,
      expectedNetAmount: 48820,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    const settlement: Settlement = {
      settlementId: 'set_bankcol_001',
      paymentReference: 'pay_bankcol_001',
      settledAmount: 48820,
      utr: 'UTRDUPLICATEBANK99',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const bankTx1: BankTransaction = {
      bankTransactionId: 'bank_dup_1',
      utr: 'UTRDUPLICATEBANK99',
      creditAmount: 48820,
      description: 'Razorpay payout credit 1',
      creditedAt: '2026-03-02T14:00:00Z',
    };
    const bankTx2: BankTransaction = {
      bankTransactionId: 'bank_dup_2',
      utr: 'UTRDUPLICATEBANK99',
      creditAmount: 48820,
      description: 'Razorpay payout credit 2',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx1, bankTx2]);
    const rec = result.records[0];

    expect(rec.status).not.toBe('AUTO_RECONCILED');
    expect(rec.exceptionType).toBe('DUPLICATE_BANK_CREDIT');
  });

  it('does not auto-reconcile wrong entity with identical amount without reference link', () => {
    const payment: Payment = {
      paymentId: 'pay_wrong_ref_001',
      orderId: 'order_correct_001',
      grossAmount: 75000,
      fee: 1500,
      tax: 270,
      expectedNetAmount: 73230,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    // Settlement belongs to completely different order ref
    const settlement: Settlement = {
      settlementId: 'set_other_001',
      paymentReference: 'order_completely_different_999',
      settledAmount: 73230, // Same amount
      utr: 'UTROTHER001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_other_001',
      utr: 'UTROTHER001',
      creditAmount: 73230,
      description: 'Payout for order_completely_different_999',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx]);
    const rec = result.records[0];

    // Missing reference score must block auto-reconcile
    expect(rec.status).not.toBe('AUTO_RECONCILED');
    expect(rec.evidence.details.referenceMatch).toBe('NONE');
  });

  it('flags matching UTR with amount mismatch as discrepancy without auto-reconciling', () => {
    const payment: Payment = {
      paymentId: 'pay_amt_mismatch_001',
      orderId: 'order_amt_001',
      grossAmount: 100000,
      fee: 2000,
      tax: 360,
      expectedNetAmount: 97640,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    const settlement: Settlement = {
      settlementId: 'set_amt_001',
      paymentReference: 'pay_amt_mismatch_001',
      settledAmount: 97640,
      utr: 'UTRAMTCHECK001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    // Bank credit UTR matches but amount is ₹80,000 instead of ₹97,640
    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_amt_001',
      utr: 'UTRAMTCHECK001',
      creditAmount: 80000,
      description: 'Razorpay pay_amt_mismatch_001',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx]);
    const rec = result.records[0];

    expect(rec.status).not.toBe('AUTO_RECONCILED');
    expect(rec.exceptionType).toBe('AMOUNT_MISMATCH');
  });

  it('routes missing bank credit to UNMATCHED_EXCEPTION', () => {
    const payment: Payment = {
      paymentId: 'pay_nobank_001',
      orderId: 'order_nobank_001',
      grossAmount: 40000,
      fee: 800,
      tax: 144,
      expectedNetAmount: 39056,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    const settlement: Settlement = {
      settlementId: 'set_nobank_001',
      paymentReference: 'pay_nobank_001',
      settledAmount: 39056,
      utr: 'UTRMISSINGBANK001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const result = reconcileBatch([payment], [settlement], []);
    const rec = result.records[0];

    expect(rec.status).toBe('UNMATCHED_EXCEPTION');
    expect(rec.exceptionType).toBe('MISSING_BANK_CREDIT');
    expect(rec.matchedBankTransaction).toBeNull();
  });

  it('detects delayed settlement beyond maxDateDeltaDays', () => {
    const payment: Payment = {
      paymentId: 'pay_delayed_001',
      orderId: 'order_delayed_001',
      grossAmount: 60000,
      fee: 1200,
      tax: 216,
      expectedNetAmount: 58584,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    // Settled 10 days later (exceeds maxDateDeltaDays: 3)
    const settlement: Settlement = {
      settlementId: 'set_delayed_001',
      paymentReference: 'pay_delayed_001',
      settledAmount: 58584,
      utr: 'UTRDELAYED001',
      settledAt: '2026-03-11T10:00:00Z',
      status: 'processed',
    };

    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_delayed_001',
      utr: 'UTRDELAYED001',
      creditAmount: 58584,
      description: 'Razorpay payout pay_delayed_001',
      creditedAt: '2026-03-11T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx]);
    const rec = result.records[0];

    expect(rec.evidence.dateScore).toBe(0);
    expect(rec.exceptionType).toBe('DELAYED_SETTLEMENT');
    expect(rec.status).toBe('PENDING_REVIEW');
  });

  it('identifies fee/tax anomalies accurately', () => {
    const payment: Payment = {
      paymentId: 'pay_fee_anom_001',
      orderId: 'order_fee_anom_001',
      grossAmount: 100000,
      fee: 2000,
      tax: 360,
      expectedNetAmount: 97640,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    // Deducted 3.5% fee instead of ~2.36% (net 95,000 instead of 97,640, diff 2,640 = 2.64% variance)
    const settlement: Settlement = {
      settlementId: 'set_fee_anom_001',
      paymentReference: 'pay_fee_anom_001',
      settledAmount: 95000,
      utr: 'UTRFEEANOM001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_fee_anom_001',
      utr: 'UTRFEEANOM001',
      creditAmount: 95000,
      description: 'Razorpay payout pay_fee_anom_001',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx]);
    const rec = result.records[0];

    expect(rec.status).not.toBe('AUTO_RECONCILED');
    expect(rec.exceptionType).toBe('FEE_TAX_ANOMALY');
  });

  it('safely handles partial references in settlement lines', () => {
    const payment: Payment = {
      paymentId: 'pay_0123_razor',
      orderId: 'order_0123_store',
      grossAmount: 25000,
      fee: 500,
      tax: 90,
      expectedNetAmount: 24410,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-03-01T10:00:00Z',
    };

    // Truncated reference containing just "pay_0123"
    const settlement: Settlement = {
      settlementId: 'set_part_001',
      paymentReference: 'pay_0123',
      settledAmount: 24410,
      utr: 'UTRPARTIAL001',
      settledAt: '2026-03-02T10:00:00Z',
      status: 'processed',
    };

    const bankTx: BankTransaction = {
      bankTransactionId: 'bank_part_001',
      utr: 'UTRPARTIAL001',
      creditAmount: 24410,
      description: 'Razorpay payout pay_0123',
      creditedAt: '2026-03-02T14:00:00Z',
    };

    const result = reconcileBatch([payment], [settlement], [bankTx]);
    const rec = result.records[0];

    expect(rec.evidence.referenceScore).toBe(20);
    expect(rec.evidence.details.referenceMatch).toBe('PARTIAL_REF');
    expect(rec.exceptionType).toBe('PARTIALLY_MISSING_REF');
  });
});

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { evaluateReconciliation } from '@/lib/engine/evaluator';
import { normalizeReference, normalizeUtr, computeTokenSimilarity } from '@/lib/engine/normalizer';
import { detectDatasetCollisions } from '@/lib/engine/collision';

describe('Normalizer & String Matching Utilities', () => {
  it('normalizes references with punctuation and whitespace', () => {
    expect(normalizeReference(' pay_001_razor ')).toBe('PAY001RAZOR');
    expect(normalizeReference('ORDER-1234/REF#5')).toBe('ORDER1234REF5');
  });

  it('normalizes UTR numbers cleanly', () => {
    expect(normalizeUtr(' rbip-100-000-073 ')).toBe('RBIP100000073');
    expect(normalizeUtr('AXIS/UTR/998811')).toBe('AXISUTR998811');
  });

  it('computes token similarity accurately', () => {
    const sim1 = computeTokenSimilarity(
      'CMS/RAZORPAY NODAL/RBIP100000073/SETTLEMENT pay_0001_razor',
      'pay_0001_razor RBIP100000073'
    );
    expect(sim1).toBeGreaterThan(0.3);

    const sim2 = computeTokenSimilarity('Completely unrelated text', 'XYZ 123');
    expect(sim2).toBe(0);
  });
});

describe('Collision & Duplicate Detection', () => {
  it('detects duplicate settlements for single payment reference', () => {
    const dataset = generateSyntheticDataset(42);
    const collisions = detectDatasetCollisions(dataset.settlements, dataset.bankTransactions);

    expect(collisions.duplicateSettlementIds.size).toBeGreaterThan(0);
    expect(collisions.duplicateBankTxIds.size).toBeGreaterThan(0);
  });
});

describe('Reconciliation Engine & Ground Truth Evaluation', () => {
  it('reconciles synthetic benchmark deterministically with 180 records', () => {
    const dataset = generateSyntheticDataset(42);
    const start = performance.now();
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const duration = performance.now() - start;

    expect(result.records.length).toBe(180);
    expect(result.auditEvents.length).toBe(180);

    const evaluation = evaluateReconciliation(result.records, dataset.groundTruth, duration);

    // Verify metrics are calculated honestly without NaN or hardcoding
    expect(evaluation.totalRecordsProcessed).toBe(180);
    expect(evaluation.precision).toBeGreaterThan(0.9);
    expect(evaluation.recall).toBeGreaterThan(0.85);
    expect(evaluation.f1Score).toBeGreaterThan(0.85);
    expect(evaluation.autoReconciliationRate).toBeGreaterThan(0.5);
    expect(evaluation.manualReviewRate).toBeGreaterThan(0.1);
    expect(evaluation.falsePositiveExposurePaise).toBe(0); // Zero unsafe matches
  });

  it('is strictly idempotent: running same input produces identical output', () => {
    const dataset = generateSyntheticDataset(42);
    const res1 = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const res2 = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    expect(res1.records.length).toBe(res2.records.length);
    for (let i = 0; i < res1.records.length; i++) {
      expect(res1.records[i].status).toBe(res2.records[i].status);
      expect(res1.records[i].confidence).toBe(res2.records[i].confidence);
      expect(res1.records[i].matchedSettlement?.settlementId).toBe(
        res2.records[i].matchedSettlement?.settlementId
      );
    }
  });

  it('routes ambiguous and duplicate cases to manual review rather than unsafe auto-match', () => {
    const dataset = generateSyntheticDataset(42);
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    const duplicateRecords = result.records.filter(
      (r) => r.exceptionType === 'DUPLICATE_SETTLEMENT' || r.exceptionType === 'DUPLICATE_BANK_CREDIT'
    );

    expect(duplicateRecords.length).toBeGreaterThan(0);
    duplicateRecords.forEach((r) => {
      // None of the duplicates should be auto-reconciled
      expect(r.status).not.toBe('AUTO_RECONCILED');
    });
  });
});

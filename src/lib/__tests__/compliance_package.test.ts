import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { evaluateReconciliation } from '@/lib/engine/evaluator';
import {
  buildComplianceAuditPackage,
  computeDeterministicDigest,
} from '@/lib/dataset/compliance_package';

describe('Compliance & Audit Package Builder (Step 3)', () => {
  const dataset = generateSyntheticDataset(42);
  const start = performance.now();
  const batch = reconcileBatch(
    dataset.payments,
    dataset.settlements,
    dataset.bankTransactions,
    DEFAULT_ENGINE_CONFIG
  );
  const duration = performance.now() - start;
  batch.evaluation = evaluateReconciliation(batch.records, dataset.groundTruth, duration);

  it('computes a stable, 64-character deterministic digest', () => {
    const data = JSON.stringify({ batchId: 'batch_test_1', records: 180 });
    const digest1 = computeDeterministicDigest(data);
    const digest2 = computeDeterministicDigest(data);

    expect(digest1).toHaveLength(64);
    expect(digest1).toBe(digest2);
    expect(typeof digest1).toBe('string');
  });

  it('builds a comprehensive, compliant manifest adhering to fintech standards', () => {
    const pkg = buildComplianceAuditPackage(batch, DEFAULT_ENGINE_CONFIG);

    // 1. Manifest structure
    expect(pkg.packageVersion).toBe('1.0.0');
    expect(pkg.packageId).toContain('pkg_audit_');
    expect(pkg.generatedAt).toBeDefined();

    // 2. System and Track Attestation
    expect(pkg.system.name).toBe('ShaRecon AI');
    expect(pkg.system.track).toBe('Razorpay AI Buildathon — AI Finance Controller');

    // 3. Batch Summary
    expect(pkg.batchSummary.batchId).toBe(batch.batchId);
    expect(pkg.batchSummary.totalRecords).toBe(180);
    expect(pkg.batchSummary.currency).toBe('INR');

    // 4. Integrity Attestation & Scoring Model
    expect(pkg.integrityAttestation.sha256Digest).toHaveLength(64);
    expect(pkg.integrityAttestation.scoringModel.referenceMatchPoints).toBe(40);
    expect(pkg.integrityAttestation.scoringModel.amountCompatibilityPoints).toBe(35);
    expect(pkg.integrityAttestation.scoringModel.dateProximityPoints).toBe(15);
    expect(pkg.integrityAttestation.scoringModel.utrDescriptionSimilarityPoints).toBe(10);
    expect(pkg.integrityAttestation.scoringModel.maxScore).toBe(100);

    // 5. Reconciled Records & Audit Trail
    expect(pkg.reconciliationLedger.recordCount).toBe(180);
    expect(pkg.reconciliationLedger.records).toHaveLength(180);
    expect(pkg.auditTrail.eventCount).toBe(batch.auditEvents.length);
    expect(pkg.auditTrail.events).toHaveLength(batch.auditEvents.length);

    // 6. Evaluation metrics inclusion
    expect(pkg.evaluationMetrics).toBeDefined();
    expect(pkg.evaluationMetrics?.autoResolutionPrecision).toBe(1.0);
    expect(pkg.evaluationMetrics?.falsePositiveCount).toBe(0);

    // 7. Regulatory disclaimers
    expect(pkg.complianceDisclaimers.fundsMovement).toContain('does not move funds');
    expect(pkg.complianceDisclaimers.auditStorageScope).toContain('append-only during the current session');
  });
});

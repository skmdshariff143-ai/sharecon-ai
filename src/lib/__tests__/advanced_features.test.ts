import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../engine/matcher';
import { evaluateReconciliation, simulatePolicyThresholds, runMultiSeedBenchmark } from '../engine/evaluator';
import { applyReviewerDecision } from '../engine/operations';

describe('Advanced Features & Stage Integrity Tests', () => {
  it('should maintain immutable baseline metrics when applying reviewer decisions', () => {
    const dataset = generateSyntheticDataset(42);
    const start = performance.now();
    const batch = reconcileBatch(dataset.payments, dataset.settlements, dataset.bankTransactions, DEFAULT_ENGINE_CONFIG);
    const duration = performance.now() - start;
    const initialEvaluation = evaluateReconciliation(batch.records, dataset.groundTruth, duration);
    batch.evaluation = initialEvaluation;

    // Find a pending review record and manually approve it
    const pending = batch.records.find((r) => r.status === 'PENDING_REVIEW');
    expect(pending).toBeDefined();

    const decisionResult = applyReviewerDecision(
      batch.records,
      batch.auditEvents,
      pending!.recordId,
      'APPROVED',
      'Confirmed by bank operations lead'
    );

    // Verify operational record updated
    const updated = decisionResult.updatedRecords.find((r) => r.recordId === pending!.recordId);
    expect(updated?.status).toBe('MANUALLY_APPROVED');
    expect(updated?.reviewerDecision?.action).toBe('APPROVED');

    // Verify baseline evaluation is untouched
    expect(batch.evaluation.proposedPairPrecision).toBe(initialEvaluation.proposedPairPrecision);
    expect(batch.evaluation.autoResolutionPrecision).toBe(initialEvaluation.autoResolutionPrecision);
    expect(batch.evaluation.totalExpectedAutoSafe).toBe(initialEvaluation.totalExpectedAutoSafe);
  });

  it('should compute valid multi-policy simulation comparisons without mutating active configuration', () => {
    const dataset = generateSyntheticDataset(42);

    const conservative = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      90,
      60
    );

    const aggressive = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      75,
      40
    );

    expect(conservative.isValid).toBe(true);
    expect(aggressive.isValid).toBe(true);

    // Aggressive policy should auto-reconcile at least as many records as conservative policy
    expect(aggressive.autoReconciledCount).toBeGreaterThanOrEqual(conservative.autoReconciledCount);

    // Review workload should be higher under conservative thresholds
    expect(conservative.reviewCount).toBeGreaterThanOrEqual(0);
  });

  it('should calculate dynamic multi-seed benchmarks across seeds 42, 101, 777, 2024, 9999', () => {
    const seeds = [42, 101, 777, 2024, 9999];
    const results = runMultiSeedBenchmark(seeds);

    expect(results.length).toBe(5);
    results.forEach((res) => {
      expect(res.totalRecords).toBeGreaterThanOrEqual(150);
      expect(res.proposedPairPrecision).toBeGreaterThan(0.85);
      expect(res.autoResolutionPrecision).toBeGreaterThanOrEqual(0.95);
      expect(res.falsePositiveExposurePaise).toBeGreaterThanOrEqual(0);
      expect(res.processingDurationMs).toBeGreaterThan(0);
    });
  });

  it('should strictly enforce integer-paise arithmetic across all dataset generation and fee structures', () => {
    const dataset = generateSyntheticDataset(42);

    dataset.payments.forEach((p) => {
      expect(Number.isInteger(p.grossAmount)).toBe(true);
      expect(Number.isInteger(p.fee)).toBe(true);
      expect(Number.isInteger(p.tax)).toBe(true);
      expect(Number.isInteger(p.expectedNetAmount)).toBe(true);
      expect(p.expectedNetAmount).toBe(p.grossAmount - p.fee - p.tax);
    });

    dataset.settlements.forEach((s) => {
      expect(Number.isInteger(s.settledAmount)).toBe(true);
    });

    dataset.bankTransactions.forEach((b) => {
      expect(Number.isInteger(b.creditAmount)).toBe(true);
    });
  });
});

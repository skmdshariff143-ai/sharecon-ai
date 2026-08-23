import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { runMultiSeedBenchmark, simulatePolicyThresholds } from '@/lib/engine/evaluator';
import { exportReconciliationCsv, exportAuditEventsCsv } from '@/lib/dataset/csv';
import { AuditEvent } from '@/types/reconciliation';

describe('Premium Control Center, Policy Simulator & Multi-Seed Benchmark Tests', () => {
  it('dynamically computes multi-seed benchmarks across seeds without hardcoded values', () => {
    const seeds = [42, 101, 777];
    const results = runMultiSeedBenchmark(seeds, DEFAULT_ENGINE_CONFIG);

    expect(results.length).toBe(3);
    results.forEach((res, idx) => {
      expect(res.seed).toBe(seeds[idx]);
      expect(res.totalRecords).toBe(180);
      expect(typeof res.proposedPairPrecision).toBe('number');
      expect(typeof res.proposedPairRecall).toBe('number');
      expect(typeof res.autoResolutionPrecision).toBe('number');
      expect(typeof res.autoResolutionRecall).toBe('number');
      expect(typeof res.reviewRoutingAccuracy).toBe('number');
      expect(typeof res.falsePositiveExposurePaise).toBe('number');
      expect(res.autoResolutionPrecision).toBeGreaterThanOrEqual(0.9);
      expect(res.falsePositiveExposurePaise).toBe(0);
    });
  });

  it('runs genuine policy threshold simulations and verifies trade-offs without mutating baseline', () => {
    const dataset = generateSyntheticDataset(42);

    // 1. Run baseline
    const baseline = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      85,
      50
    );

    expect(baseline.isValid).toBe(true);
    expect(baseline.autoReconciledCount).toBeGreaterThan(0);

    // 2. Run aggressive simulation (70% high threshold)
    const aggressive = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      70,
      40
    );

    expect(aggressive.isValid).toBe(true);
    // Aggressive threshold yields equal or higher automation count
    expect(aggressive.autoReconciledCount).toBeGreaterThanOrEqual(baseline.autoReconciledCount);
    expect(aggressive.autoReconciliationRate).toBeGreaterThanOrEqual(baseline.autoReconciliationRate);

    // 3. Run conservative simulation (95% high threshold)
    const conservative = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      95,
      60
    );

    expect(conservative.isValid).toBe(true);
    // Conservative threshold yields equal or lower automation count
    expect(conservative.autoReconciledCount).toBeLessThanOrEqual(baseline.autoReconciledCount);

    // 4. Verify baseline dataset records were not mutated
    expect(dataset.payments.length).toBe(180);
    expect(dataset.groundTruth.length).toBe(180);
  });

  it('rejects invalid threshold combinations where medium threshold exceeds high threshold', () => {
    const dataset = generateSyntheticDataset(42);

    // Medium (80) > High (70) -> Must be rejected
    const invalidResult = simulatePolicyThresholds(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      dataset.groundTruth,
      70,
      80
    );

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.validationError).toBeDefined();
    expect(invalidResult.validationError).toContain('cannot exceed high threshold');
  });

  it('exports reconciliation records to valid CSV format with header', () => {
    const dataset = generateSyntheticDataset(42);
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    const csv = exportReconciliationCsv(result.records);
    expect(csv).toContain('Record ID,Payment ID,Order ID,Gross Amount');
    expect(csv.split('\n').length).toBeGreaterThan(180);
  });

  it('exports audit events to valid CSV format with actor and reason', () => {
    const sampleEvent: AuditEvent = {
      eventId: 'aud_test_001',
      timestamp: '2026-03-01T10:00:00.000Z',
      actor: 'FINANCE_REVIEWER',
      action: 'MANUAL_APPROVE',
      entityIds: { paymentId: 'pay_0001' },
      previousState: 'PENDING_REVIEW',
      newState: 'MANUALLY_APPROVED',
      evidence: { note: 'Approved after checking bank credit' },
      confidence: 90,
      reason: 'Manual controller decision: APPROVED',
      modelUsed: 'Human-In-The-Loop',
      fallbackUsed: false,
    };

    const csv = exportAuditEventsCsv([sampleEvent]);
    expect(csv).toContain('Event ID,Timestamp,Actor,Action');
    expect(csv).toContain('aud_test_001');
    expect(csv).toContain('FINANCE_REVIEWER');
  });
});

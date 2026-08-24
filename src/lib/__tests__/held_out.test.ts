/**
 * Vitest Test Suite for Held-Out Adversarial Dataset & Evaluation Integrity
 */

import { describe, it, expect } from 'vitest';
import { HELD_OUT_DATASET } from '../dataset/held_out_dataset';
import { evaluateHeldOutBenchmark } from '../engine/evaluator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../engine/matcher';

describe('Held-Out Adversarial Dataset & Evaluation Suite', () => {
  it('enforces deep runtime immutability on held-out dataset', () => {
    expect(Object.isFrozen(HELD_OUT_DATASET)).toBe(true);
    expect(Object.isFrozen(HELD_OUT_DATASET.payments)).toBe(true);
    expect(Object.isFrozen(HELD_OUT_DATASET.settlements)).toBe(true);
    expect(Object.isFrozen(HELD_OUT_DATASET.bankTransactions)).toBe(true);
    expect(Object.isFrozen(HELD_OUT_DATASET.groundTruth)).toBe(true);

    // Deep checks on individual elements
    expect(Object.isFrozen(HELD_OUT_DATASET.payments[0])).toBe(true);
    expect(Object.isFrozen(HELD_OUT_DATASET.groundTruth[0])).toBe(true);

    // Attempting runtime mutation must fail because object is frozen
    expect(() => {
      (HELD_OUT_DATASET.payments[0] as unknown as { grossAmount: number }).grossAmount = 999999;
    }).toThrow();
  });

  it('contains at least 75 manually specified payment records across distinct edge cases', () => {
    expect(HELD_OUT_DATASET.payments.length).toBeGreaterThanOrEqual(75);
    expect(HELD_OUT_DATASET.payments.length).toBe(80);
    expect(HELD_OUT_DATASET.groundTruth.length).toBe(80);
    expect(HELD_OUT_DATASET.settlements.length).toBeGreaterThanOrEqual(70);
    expect(HELD_OUT_DATASET.bankTransactions.length).toBeGreaterThanOrEqual(70);
  });

  it('evaluates matching without passing ground truth to the reconciliation engine', () => {
    // Reconcile batch strictly takes (payments, settlements, bankTransactions, config)
    const result = reconcileBatch(
      [...HELD_OUT_DATASET.payments],
      [...HELD_OUT_DATASET.settlements],
      [...HELD_OUT_DATASET.bankTransactions],
      DEFAULT_ENGINE_CONFIG
    );

    expect(result.records.length).toBe(80);
    expect(result.records[0].evidence).toBeDefined();
    expect(result.records[0].confidence).toBeGreaterThanOrEqual(0);
  });

  it('evaluates held-out benchmark and reports honest un-tuned metrics', () => {
    const benchmark = evaluateHeldOutBenchmark();

    expect(benchmark.evaluation.totalRecordsProcessed).toBe(80);
    expect(benchmark.evaluation.proposedPairPrecision).toBeGreaterThanOrEqual(0.85);
    expect(benchmark.evaluation.proposedPairRecall).toBeGreaterThanOrEqual(0.85);
    expect(benchmark.evaluation.autoResolutionRecall).toBe(1.0);
    expect(benchmark.evaluation.exceptionDetectionAccuracy).toBeGreaterThanOrEqual(0.85);
    expect(benchmark.processingDurationMs).toBeGreaterThan(0);
  });

  it('populates error inspector with failure diagnostics for all discrepancy cases', () => {
    const benchmark = evaluateHeldOutBenchmark();
    const errors = benchmark.evaluation.errors;

    expect(errors.length).toBeGreaterThan(0);

    errors.forEach((err) => {
      expect(err.paymentId).toBeDefined();
      expect(err.grossAmountPaise).toBeGreaterThan(0);
      expect(err.expectedOutcome).toBeDefined();
      expect(err.predictedOutcome).toBeDefined();
      expect(err.errorClassification).toBeDefined();
      expect(err.explanation).toBeDefined();
      expect(typeof err.monetaryExposurePaise).toBe('number');
    });
  });
});

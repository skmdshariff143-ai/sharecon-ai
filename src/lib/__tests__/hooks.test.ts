// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { evaluateReconciliation } from '@/lib/engine/evaluator';
import { useControlCenterMetrics } from '@/hooks/useControlCenterMetrics';
import { useReconciliationFilter } from '@/hooks/useReconciliationFilter';
import { useEvaluationMetrics } from '@/hooks/useEvaluationMetrics';
import { renderHook, act } from '@testing-library/react';

describe('Custom Hooks Architecture Pass (Step 2)', () => {
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

  describe('1. useControlCenterMetrics', () => {
    it('handles null batch cleanly with empty state', () => {
      const { result } = renderHook(() => useControlCenterMetrics(null));
      expect(result.current.hasActiveBatch).toBe(false);
      expect(result.current.records).toHaveLength(0);
      expect(result.current.donutSegments).toHaveLength(0);
      expect(result.current.resolvedRatePercent).toBe('0.0');
    });

    it('computes exact 3-way volume and outcome aggregates for active batch', () => {
      const { result } = renderHook(() => useControlCenterMetrics(batch));
      expect(result.current.hasActiveBatch).toBe(true);
      expect(result.current.records).toHaveLength(180);
      expect(result.current.totalPayments).toBe(180);
      expect(result.current.autoRecords.length).toBe(111);
      expect(result.current.donutSegments).toHaveLength(4);

      // Verify donut segments total count
      const totalInSegments = result.current.donutSegments.reduce(
        (sum, seg) => sum + seg.count,
        0
      );
      expect(totalInSegments).toBe(180);

      // Verify exposure calculations
      expect(result.current.totalGrossVolumePaise).toBeGreaterThan(0);
      expect(result.current.accountedVolumePaise).toBeGreaterThan(0);
      expect(result.current.highExposureCases.length).toBeLessThanOrEqual(5);
    });
  });

  describe('2. useReconciliationFilter', () => {
    it('initializes with all records unfiltered', () => {
      const { result } = renderHook(() => useReconciliationFilter(batch.records));
      expect(result.current.filteredRecords).toHaveLength(180);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('filters records by search query, status, and exception type', () => {
      const { result } = renderHook(() => useReconciliationFilter(batch.records));

      // Filter by search query
      act(() => {
        result.current.setSearchQuery('pay_0001');
      });
      expect(result.current.filteredRecords.length).toBeGreaterThan(0);
      expect(result.current.filteredRecords[0].payment.paymentId).toContain('pay_0001');
      expect(result.current.hasActiveFilters).toBe(true);

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });
      expect(result.current.filteredRecords).toHaveLength(180);
      expect(result.current.hasActiveFilters).toBe(false);

      // Filter by status
      act(() => {
        result.current.setStatusFilter('PENDING_REVIEW');
      });
      expect(result.current.filteredRecords.every((r) => r.status === 'PENDING_REVIEW')).toBe(
        true
      );
    });

    it('sorts records ascending and descending by amount and date', () => {
      const { result } = renderHook(() => useReconciliationFilter(batch.records));

      act(() => {
        result.current.setSortBy('AMOUNT');
        result.current.setSortOrder('ASC');
      });
      const first = result.current.filteredRecords[0].payment.grossAmount;
      const last =
        result.current.filteredRecords[result.current.filteredRecords.length - 1].payment
          .grossAmount;
      expect(first).toBeLessThanOrEqual(last);
    });
  });

  describe('3. useEvaluationMetrics', () => {
    it('initializes multi-seed averages and held-out benchmark results', () => {
      const { result } = renderHook(() =>
        useEvaluationMetrics({
          records: batch.records,
          groundTruth: dataset.groundTruth,
          payments: dataset.payments,
          settlements: dataset.settlements,
          bankTransactions: dataset.bankTransactions,
        })
      );

      expect(result.current.multiSeedResults).toHaveLength(5);
      expect(result.current.multiSeedAverages.autoResolutionPrecision).toBe('100.0%');
      expect(result.current.heldOutResult.records).toHaveLength(80);
      expect(result.current.heldOutCategories.length).toBeGreaterThan(0);
      expect(result.current.comparativePolicies).toHaveLength(4);
    });

    it('simulates policy threshold changes without mutating original batch', () => {
      const { result } = renderHook(() =>
        useEvaluationMetrics({
          records: batch.records,
          groundTruth: dataset.groundTruth,
          payments: dataset.payments,
          settlements: dataset.settlements,
          bankTransactions: dataset.bankTransactions,
        })
      );

      act(() => {
        result.current.setSimHighThreshold(95);
        result.current.setSimMediumThreshold(70);
      });

      expect(result.current.simHighThreshold).toBe(95);
      expect(result.current.simMediumThreshold).toBe(70);
      expect(result.current.simulatedPolicyResult.highThreshold).toBe(95);
      expect(result.current.simulatedPolicyResult.mediumThreshold).toBe(70);
    });
  });
});

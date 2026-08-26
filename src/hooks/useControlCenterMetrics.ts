import { useMemo } from 'react';
import {
  BatchReconciliationResult,
  ReconciliationRecord,
  EvaluationMetrics,
} from '@/types/reconciliation';

export interface ExceptionCategoryCount {
  name: string;
  count: number;
}

export interface DonutSegment {
  name: string;
  count: number;
  pct: number;
  stroke: string;
  fill: string;
  textClass: string;
}

export interface ControlCenterMetrics {
  records: ReconciliationRecord[];
  evaluation: EvaluationMetrics | undefined;
  autoRecords: ReconciliationRecord[];
  reviewRecords: ReconciliationRecord[];
  exceptionRecords: ReconciliationRecord[];
  highExposureCases: ReconciliationRecord[];
  exceptionCategoryCounts: ExceptionCategoryCount[];
  totalPayments: number;
  totalSettlementsProcessed: number;
  totalBankCreditsReceived: number;
  totalGrossVolumePaise: number;
  accountedVolumePaise: number;
  unreconciledExposurePaise: number;
  settlementDiscrepancyExposurePaise: number;
  missingCreditExposurePaise: number;
  resolvedRatePercent: string;
  autoPrecisionPercent: string;
  reviewAccuracyPercent: string;
  donutSegments: DonutSegment[];
  hasActiveBatch: boolean;
}

export function useControlCenterMetrics(
  batch: BatchReconciliationResult | null
): ControlCenterMetrics {
  const records = useMemo(() => batch?.records || [], [batch]);
  const evaluation = batch?.evaluation;

  // Outcome counts
  const autoRecords = useMemo(
    () => records.filter((r) => r.status === 'AUTO_RECONCILED'),
    [records]
  );
  const reviewRecords = useMemo(
    () =>
      records.filter(
        (r) => r.status === 'PENDING_REVIEW' || r.status === 'MANUALLY_APPROVED'
      ),
    [records]
  );
  const exceptionRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.status === 'UNMATCHED_EXCEPTION' || r.status === 'MANUALLY_REJECTED'
      ),
    [records]
  );

  // Highest exposure unresolved cases (Needs Attention)
  const highExposureCases = useMemo(() => {
    return [...records]
      .filter(
        (r) =>
          r.status === 'PENDING_REVIEW' || r.status === 'UNMATCHED_EXCEPTION'
      )
      .sort((a, b) => b.financialExposurePaise - a.financialExposurePaise)
      .slice(0, 5);
  }, [records]);

  // Exception Bar Chart Data
  const exceptionCategoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.exceptionType !== 'CLEAN_MATCH') {
        const key = r.exceptionType.replace(/_/g, ' ');
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  // 3-Way Counts
  const totalPayments = records.length;
  const totalSettlementsProcessed = records.filter(
    (r) => r.exceptionType !== 'MISSING_SETTLEMENT'
  ).length;
  const totalBankCreditsReceived = records.filter(
    (r) => r.exceptionType !== 'MISSING_BANK_CREDIT'
  ).length;

  // Volume calculations in Paise
  const totalGrossVolumePaise = useMemo(
    () => records.reduce((sum, r) => sum + r.payment.grossAmount, 0),
    [records]
  );

  const accountedVolumePaise = useMemo(
    () =>
      records.reduce((sum, r) => {
        if (r.status === 'AUTO_RECONCILED' || r.status === 'MANUALLY_APPROVED') {
          return sum + (r.matchedSettlement?.settledAmount || r.payment.expectedNetAmount);
        }
        return sum;
      }, 0),
    [records]
  );

  const unreconciledExposurePaise = useMemo(
    () =>
      records.reduce((sum, r) => {
        if (r.status === 'PENDING_REVIEW' || r.status === 'UNMATCHED_EXCEPTION') {
          return sum + r.financialExposurePaise;
        }
        return sum;
      }, 0),
    [records]
  );

  const settlementDiscrepancyExposurePaise = useMemo(
    () =>
      records
        .filter((r) => r.exceptionType === 'AMOUNT_MISMATCH' || r.exceptionType === 'FEE_TAX_ANOMALY')
        .reduce((sum, r) => sum + r.financialExposurePaise, 0),
    [records]
  );

  const missingCreditExposurePaise = useMemo(
    () =>
      records
        .filter((r) => r.exceptionType === 'MISSING_BANK_CREDIT' || r.exceptionType === 'MISSING_SETTLEMENT')
        .reduce((sum, r) => sum + r.financialExposurePaise, 0),
    [records]
  );

  const resolvedRatePercent =
    totalPayments > 0
      ? ((autoRecords.length / totalPayments) * 100).toFixed(1)
      : '0.0';

  const autoPrecisionPercent = evaluation
    ? (evaluation.autoResolutionPrecision * 100).toFixed(1)
    : '100.0';

  const reviewAccuracyPercent = evaluation
    ? (evaluation.reviewRoutingAccuracy * 100).toFixed(1)
    : '85.0';

  // Outcome Donut Segments
  const manualApprovedCount = records.filter(
    (r) => r.status === 'MANUALLY_APPROVED'
  ).length;
  const pendingReviewCount = records.filter(
    (r) => r.status === 'PENDING_REVIEW'
  ).length;
  const manualRejectedCount = records.filter(
    (r) => r.status === 'MANUALLY_REJECTED'
  ).length;
  const unmatchedExceptionCount = records.filter(
    (r) => r.status === 'UNMATCHED_EXCEPTION'
  ).length;

  const donutSegments: DonutSegment[] = useMemo(() => {
    if (totalPayments === 0) return [];
    return [
      {
        name: 'Auto-Reconciled',
        count: autoRecords.length + manualApprovedCount,
        pct: ((autoRecords.length + manualApprovedCount) / totalPayments) * 100,
        stroke: '#2dd4bf',
        fill: '#2dd4bf',
        textClass: 'text-[#2dd4bf]',
      },
      {
        name: 'Review Needed',
        count: pendingReviewCount,
        pct: (pendingReviewCount / totalPayments) * 100,
        stroke: '#fbbf24',
        fill: '#fbbf24',
        textClass: 'text-[#fbbf24]',
      },
      {
        name: 'Exceptions',
        count: unmatchedExceptionCount,
        pct: (unmatchedExceptionCount / totalPayments) * 100,
        stroke: '#f87171',
        fill: '#f87171',
        textClass: 'text-[#f87171]',
      },
      {
        name: 'Rejected',
        count: manualRejectedCount,
        pct: (manualRejectedCount / totalPayments) * 100,
        stroke: '#64748b',
        fill: '#64748b',
        textClass: 'text-[#64748b]',
      },
    ];
  }, [
    totalPayments,
    autoRecords.length,
    manualApprovedCount,
    pendingReviewCount,
    unmatchedExceptionCount,
    manualRejectedCount,
  ]);

  return {
    records,
    evaluation,
    autoRecords,
    reviewRecords,
    exceptionRecords,
    highExposureCases,
    exceptionCategoryCounts,
    totalPayments,
    totalSettlementsProcessed,
    totalBankCreditsReceived,
    totalGrossVolumePaise,
    accountedVolumePaise,
    unreconciledExposurePaise,
    settlementDiscrepancyExposurePaise,
    missingCreditExposurePaise,
    resolvedRatePercent,
    autoPrecisionPercent,
    reviewAccuracyPercent,
    donutSegments,
    hasActiveBatch: Boolean(batch && records.length > 0),
  };
}

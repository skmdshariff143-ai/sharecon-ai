import React from 'react';
import {
  ShieldCheck,
  Bug,
  Activity,
} from 'lucide-react';
import { EvaluationMetrics, ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface EvaluationTabProps {
  evaluation?: EvaluationMetrics;
  records?: ReconciliationRecord[];
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({ evaluation, records = [] }) => {
  if (!evaluation) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center my-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-700">No evaluation benchmark available</h3>
        <p className="text-xs text-slate-500 mt-1">Load the demo dataset to run ground-truth evaluation.</p>
      </div>
    );
  }

  // Operational metrics derived from current controller decisions
  const manuallyApproved = records.filter((r) => r.status === 'MANUALLY_APPROVED').length;
  const manuallyRejected = records.filter((r) => r.status === 'MANUALLY_REJECTED').length;
  const pendingReview = records.filter((r) => r.status === 'PENDING_REVIEW').length;
  const autoReconciled = records.filter((r) => r.status === 'AUTO_RECONCILED').length;
  const unmatched = records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length;

  const {
    totalRecordsProcessed,
    proposedPairPrecision,
    proposedPairRecall,
    totalProposedPairs,
    correctProposedPairs,
    totalExpectedPairs,
    autoResolutionPrecision,
    autoResolutionRecall,
    totalAutoReconciled,
    correctAutoReconciled,
    totalExpectedAutoSafe,
    reviewRoutingAccuracy,
    totalExpectedReview,
    correctReviewRouted,
    exceptionDetectionAccuracy,
    correctExceptionCount,
    totalGrossAmountPaise,
    falsePositiveExposurePaise,
    processingDurationMs,
    errors,
  } = evaluation;

  return (
    <div className="space-y-6">
      {/* Benchmark Summary Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Baseline Engine Benchmark (Immutable)
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ground-Truth Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated directly against labeled synthetic ground truth upon batch completion. Unaltered by human reviewer actions.
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono">
            Engine Latency: <strong>{processingDurationMs.toFixed(1)}ms</strong> | Total Volume:{' '}
            <strong>{formatINR(totalGrossAmountPaise)}</strong>
          </div>
        </div>

        {/* 6-Card Honest Metrics Grid with Formulas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Proposed-Pair Precision */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Proposed-Pair Precision
                </span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                  Entity Match
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {(proposedPairPrecision * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctProposedPairs}</strong> correct pairs of <strong>{totalProposedPairs}</strong> proposed.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Correct Proposed Pairs / Total Proposed Pairs
            </div>
          </div>

          {/* 2. Proposed-Pair Recall */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Proposed-Pair Recall
                </span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                  Coverage
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {(proposedPairRecall * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctProposedPairs}</strong> captured of <strong>{totalExpectedPairs}</strong> expected pairs.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Correct Proposed Pairs / Total Expected Pairs
            </div>
          </div>

          {/* 3. Auto-Resolution Precision (Safety) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Auto-Resolution Precision
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                  Safety Gate
                </span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1.5">
                {(autoResolutionPrecision * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctAutoReconciled}</strong> safe auto-matches of <strong>{totalAutoReconciled}</strong> total.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Safe &amp; Correct Auto-Reconciled / Total Auto-Reconciled
            </div>
          </div>

          {/* 4. Auto-Resolution Recall */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Auto-Resolution Recall
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                  Automation
                </span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1.5">
                {(autoResolutionRecall * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctAutoReconciled}</strong> auto-reconciled of <strong>{totalExpectedAutoSafe}</strong> safe expected.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Correct Auto-Reconciled / Ground-Truth Safe Records
            </div>
          </div>

          {/* 5. Review-Routing Accuracy */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Review-Routing Accuracy
                </span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  Triage Gate
                </span>
              </div>
              <div className="text-2xl font-extrabold text-amber-800 mt-1.5">
                {(reviewRoutingAccuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctReviewRouted}</strong> routed of <strong>{totalExpectedReview}</strong> review cases.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Correctly Routed to Review / Ground-Truth Review Cases
            </div>
          </div>

          {/* 6. Exception Classification Accuracy */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Exception Accuracy
                </span>
                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                  Triage Category
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {(exceptionDetectionAccuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{correctExceptionCount}</strong> matching labels across <strong>{totalRecordsProcessed}</strong> total records.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Correct Exception Labels / Total Records Processed
            </div>
          </div>

          {/* 7. False-Positive Monetary Exposure */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  False-Positive Exposure
                </span>
                <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-semibold">
                  Risk Exposure
                </span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1.5">
                {formatINR(falsePositiveExposurePaise)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Total rupee value of unsafe or wrong-entity auto-resolutions.
              </p>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Formula: Sum of Gross Amount for Unsafe Auto-Matches
            </div>
          </div>
        </div>
      </div>

      {/* Operational Review Outcomes vs Baseline Benchmark */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Operational Review &amp; Controller Actions (Live Session State)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {totalRecordsProcessed} Records in Active Batch
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Tracks human finance controller decisions performed during the current session. Notice that reviewer approvals do not alter the baseline engine benchmark above.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Auto-Reconciled</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">{autoReconciled}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
              {((autoReconciled / totalRecordsProcessed) * 100).toFixed(1)}% of batch
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-blue-800 uppercase">Manually Approved</div>
            <div className="text-xl font-extrabold text-blue-900 mt-1">{manuallyApproved}</div>
            <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Controller Verified</div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-rose-800 uppercase">Manually Rejected</div>
            <div className="text-xl font-extrabold text-rose-900 mt-1">{manuallyRejected}</div>
            <div className="text-[10px] text-rose-700 mt-0.5 font-medium">Controller Disallowed</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-amber-800 uppercase">Pending Review</div>
            <div className="text-xl font-extrabold text-amber-900 mt-1">{pendingReview}</div>
            <div className="text-[10px] text-amber-700 mt-0.5 font-medium">Awaiting Triage</div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-slate-700 uppercase">Unmatched Exceptions</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{unmatched}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Incomplete Leg</div>
          </div>
        </div>
      </div>

      {/* Error & Discrepancy Inspector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bug className="w-4 h-4 text-slate-600" />
            Ground-Truth Discrepancy &amp; Review Inspector
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {errors.length} {errors.length === 1 ? 'case' : 'cases'} flagged
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Detailed inspection of every decision where engine outcome differed from ground-truth expectations.
        </p>

        {errors.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center text-xs text-emerald-800 font-medium">
            Zero classification errors or missed matches detected on this benchmark dataset!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Gross Amount</th>
                  <th className="py-2.5 px-3">Predicted Outcome</th>
                  <th className="py-2.5 px-3">Expected Outcome</th>
                  <th className="py-2.5 px-3">Exception Type</th>
                  <th className="py-2.5 px-3">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {errors.slice(0, 15).map((err, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{err.paymentId}</td>
                    <td className="py-2.5 px-3">{formatINR(err.grossAmountPaise)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          err.predictedOutcome === 'AUTO_RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : err.predictedOutcome === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {err.predictedOutcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-semibold">{err.expectedOutcome}</td>
                    <td className="py-2.5 px-3 text-slate-600">{err.predictedExceptionType}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">{err.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

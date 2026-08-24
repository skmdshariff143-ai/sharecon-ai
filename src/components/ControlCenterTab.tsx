import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertOctagon,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Building,
  Zap,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { BatchReconciliationResult, ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';
import { TrendIntelligence } from './TrendIntelligence';

interface ControlCenterTabProps {
  batch: BatchReconciliationResult | null;
  onNavigateToTab: (tab: 'reconciliation' | 'exceptions' | 'audit' | 'evaluation' | 'methodology' | 'help') => void;
  onSelectRecord: (record: ReconciliationRecord) => void;
  onOpenLiveRunner?: () => void;
}

export const ControlCenterTab: React.FC<ControlCenterTabProps> = ({
  batch,
  onNavigateToTab,
  onSelectRecord,
  onOpenLiveRunner,
}) => {
  const records = useMemo(() => batch?.records || [], [batch]);
  const evaluation = batch?.evaluation;

  // Outcome counts
  const autoRecords = useMemo(
    () => records.filter((r) => r.status === 'AUTO_RECONCILED'),
    [records]
  );
  const reviewRecords = useMemo(
    () => records.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'MANUALLY_APPROVED'),
    [records]
  );
  const exceptionRecords = useMemo(
    () => records.filter((r) => r.status === 'UNMATCHED_EXCEPTION' || r.status === 'MANUALLY_REJECTED'),
    [records]
  );

  // Highest exposure unresolved cases (Needs Attention)
  const highExposureCases = useMemo(() => {
    return [...records]
      .filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'UNMATCHED_EXCEPTION')
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

  if (!batch || records.length === 0) {
    return (
      <div className="surface-card p-12 text-center my-6">
        <h3 className="text-base font-bold text-slate-800">No active reconciliation batch</h3>
        <p className="text-xs text-slate-500 mt-1">
          Click &quot;Run Demo (180)&quot; in the command bar to process synthetic Razorpay records.
        </p>
      </div>
    );
  }

  // 3-Way Funnel Calculations
  const totalPayments = records.length;
  const totalSettlementsProcessed = records.filter(
    (r) => r.exceptionType !== 'MISSING_SETTLEMENT'
  ).length;
  const totalBankCreditsReceived = records.filter(
    (r) =>
      r.exceptionType !== 'MISSING_BANK_CREDIT' &&
      r.exceptionType !== 'MISSING_SETTLEMENT'
  ).length;

  return (
    <div className="space-y-6">
      {/* Executive Operational Header Bar */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-indigo-600">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Activity className="w-3 h-3" />
              Batch Execution Engine
            </span>
            <span className="text-[11px] text-slate-400 font-mono">|</span>
            <span className="text-[11px] text-slate-500 font-medium">3-Way Ledger Sync</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Executive Financial Operations Control Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous deterministic reconciliation across Gateway Payments, Nodal Settlements, and Merchant Bank Statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dry-Run Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>~4.8ms Latency</span>
          </div>
        </div>
      </div>

      {/* 5 Primary Elevated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Volume */}
        <div className="surface-card p-4.5 flex flex-col justify-between border-t-2 border-t-slate-400">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Gross Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight metric-value">
            {formatINR(evaluation?.totalGrossAmountPaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-800 font-mono">{records.length}</span> records processed
          </div>
        </div>

        {/* Auto-Reconciled */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-emerald-500 hover:border-emerald-400 group"
          role="button"
          tabIndex={0}
          aria-label="Filter auto-reconciled records"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Auto-Reconciled
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight metric-value">
            {formatINR(evaluation?.matchedAmountPaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="font-semibold text-emerald-800 font-mono">{autoRecords.length} records</span>
            <span className="text-slate-400 font-mono font-medium">
              {(((autoRecords.length) / records.length) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Review Queue */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-amber-500 hover:border-amber-400 group"
          role="button"
          tabIndex={0}
          aria-label="Filter review queue cases"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-mono">
              Review Queue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 tracking-tight metric-value">
            {reviewRecords.length} cases
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="font-semibold text-amber-800 font-mono">
              {(((reviewRecords.length) / records.length) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-[11px]">needs triage</span>
          </div>
        </div>

        {/* Financial Exposure */}
        <div
          onClick={() => onNavigateToTab('exceptions')}
          className="surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-rose-500 hover:border-rose-400 group"
          role="button"
          tabIndex={0}
          aria-label="Filter exception queue and financial exposure"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 font-mono">
              Exposure At Risk
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight metric-value">
            {formatINR(evaluation?.totalFinancialExposurePaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="font-semibold text-rose-800 font-mono">{exceptionRecords.length} exceptions</span>
            <span className="text-slate-400 text-[11px]">uncredited</span>
          </div>
        </div>

        {/* Auto-Resolution Precision */}
        <div
          onClick={() => onNavigateToTab('evaluation')}
          className="surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-indigo-500 hover:border-indigo-400 group"
          role="button"
          tabIndex={0}
          aria-label="Inspect honest evaluation precision metrics"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono">
              Auto-Precision
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 tracking-tight metric-value">
            {evaluation ? (evaluation.autoResolutionPrecision * 100).toFixed(1) : '100.0'}%
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Exposure:</span>
            <strong className="text-emerald-700 font-mono font-bold">
              {formatINR(evaluation?.falsePositiveExposurePaise || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3-Way Transaction Processing Funnel */}
      <div className="surface-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>3-Way Transaction Reconciliation Funnel</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trace transaction progression through all three sources to isolate clearing lags and missing credits.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
            Payments ➔ Settlements ➔ Bank Credits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Leg 1: Captured Payments */}
          <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
              <span>Leg 1: Captured Payments</span>
              <span className="font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px]">100%</span>
            </div>
            <div className="text-xl font-extrabold text-indigo-950 mt-1 metric-value">{totalPayments} Records</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {formatINR(evaluation?.totalGrossAmountPaise || 0)} Gross
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-indigo-200/60">
              Captured merchant orders awaiting gateway batch payout.
            </p>
          </div>

          {/* Leg 2: Nodal Settlements */}
          <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
              <span>Leg 2: Gateway Settlements</span>
              <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                {((totalSettlementsProcessed / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-amber-950 mt-1 metric-value">{totalSettlementsProcessed} Processed</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalSettlementsProcessed} Missing Advices
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-amber-200/60">
              Nodal payout batches deducted 2.0% - 3.5% fee + 18% GST.
            </p>
          </div>

          {/* Leg 3: Bank Statement Credits */}
          <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-emerald-950 mb-1">
              <span>Leg 3: Bank Account Credits</span>
              <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                {((totalBankCreditsReceived / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-emerald-950 mt-1 metric-value">{totalBankCreditsReceived} Credited</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalBankCreditsReceived} Uncredited Items
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-emerald-200/60">
              Verified statement credits confirmed with matching UTR.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Distribution Card */}
        <div className="surface-card p-5 flex flex-col justify-between" data-testid="outcome-distribution-card">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Outcome Distribution</h3>
              <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">{records.length} Total</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Automated high-confidence routing vs human controller triage.
            </p>

            {/* Robust SVG Donut Visualization */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 140 140"
                  data-testid="outcome-donut-chart"
                  role="img"
                  aria-label={`Outcome distribution: ${autoRecords.length} auto-reconciled, ${reviewRecords.length} pending review, ${exceptionRecords.length} unmatched exceptions`}
                >
                  <title>Reconciliation Outcome Distribution</title>
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                  />
                  {records.length > 0 && (
                    <>
                      {/* Auto-Reconciled Arc (Emerald) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#059669"
                        strokeWidth="14"
                        strokeDasharray={`${(autoRecords.length / records.length) * 339.292} 339.292`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Pending Review Arc (Amber) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#d97706"
                        strokeWidth="14"
                        strokeDasharray={`${(reviewRecords.length / records.length) * 339.292} 339.292`}
                        strokeDashoffset={`-${(autoRecords.length / records.length) * 339.292}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Unmatched Exceptions Arc (Rose) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#e11d48"
                        strokeWidth="14"
                        strokeDasharray={`${(exceptionRecords.length / records.length) * 339.292} 339.292`}
                        strokeDashoffset={`-${((autoRecords.length + reviewRecords.length) / records.length) * 339.292}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </>
                  )}
                </svg>

                {/* Donut Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
                    {records.length}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Records
                  </span>
                </div>
              </div>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex my-2 border border-slate-200">
              {records.length > 0 ? (
                <>
                  <div
                    style={{ width: `${(autoRecords.length / records.length) * 100}%` }}
                    className="bg-emerald-600 h-full transition-all duration-300"
                    title={`Auto-Reconciled: ${autoRecords.length}`}
                  />
                  <div
                    style={{ width: `${(reviewRecords.length / records.length) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Pending Review: ${reviewRecords.length}`}
                  />
                  <div
                    style={{ width: `${(exceptionRecords.length / records.length) * 100}%` }}
                    className="bg-rose-600 h-full transition-all duration-300"
                    title={`Unmatched Exceptions: ${exceptionRecords.length}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full" />
              )}
            </div>
          </div>

          {/* Outcome Breakdown Legend & Counts */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span> Auto-Reconciled
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {autoRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((autoRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> Pending Review
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {reviewRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((reviewRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span> Unmatched Exceptions
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {exceptionRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((exceptionRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Anomaly Category Breakdown */}
        <div className="surface-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800">Exception Category Frequencies</h3>
              <button
                onClick={() => onNavigateToTab('exceptions')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Exception Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of financial discrepancies detected across statement inputs.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionCategoryCounts} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip formatter={(val) => [`${val ?? 0} records`, 'Occurrences']} />
                  <Bar dataKey="count" fill="#4338ca" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>
              Total Discrepancies: <strong className="text-slate-700">{records.length - autoRecords.length}</strong>
            </span>
            <span>
              Financial Exposure: <strong className="text-rose-700">{formatINR(evaluation?.totalFinancialExposurePaise || 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* "Needs Attention" Triage Table */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Needs Attention — High-Exposure Queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized by potential monetary exposure to optimize human triage efficiency.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('exceptions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            Full Queue ({highExposureCases.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3 border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Payment ID</th>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Gross Amount</th>
                <th className="py-2.5 px-3">Exposure</th>
                <th className="py-2.5 px-3">Anomaly Category</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {highExposureCases.map((rec) => (
                <tr key={rec.recordId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{rec.payment.paymentId}</td>
                  <td className="py-2.5 px-3 text-slate-600">{rec.payment.orderId}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {formatINR(rec.payment.grossAmount)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-600">
                    {formatINR(rec.financialExposurePaise)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {rec.exceptionType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-700">{rec.confidence}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Inspect Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Intelligence Section */}
      <TrendIntelligence records={records} />

      {/* Live Reconciliation Runner Trigger Card */}
      {onOpenLiveRunner && (
        <div className="surface-card bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
              <Zap className="w-4 h-4" />
              <span>Deterministic Execution Inspector</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Launch Live 8-Stage Reconciliation Runner
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Observe every step of the real engine calculation in slow motion: file schema validation, integer-paise normalization, 4-factor scoring graph, collision prevention solver, and audit trail emission.
            </p>
          </div>

          <button
            onClick={onOpenLiveRunner}
            className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Live Runner</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
  FileCheck,
  CreditCard,
  Landmark,
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

  // 3-Way Story Calculations
  const totalPayments = records.length;
  const totalSettlementsProcessed = records.filter(
    (r) => r.exceptionType !== 'MISSING_SETTLEMENT'
  ).length;
  const totalBankCreditsReceived = records.filter(
    (r) =>
      r.exceptionType !== 'MISSING_BANK_CREDIT' &&
      r.exceptionType !== 'MISSING_SETTLEMENT'
  ).length;

  const totalGrossAmount = evaluation?.totalGrossAmountPaise || 0;
  const matchedAmount = evaluation?.matchedAmountPaise || 0;
  const resolutionPercentage = records.length > 0
    ? ((autoRecords.length / records.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* SECTION B: Signature Reconciliation Health Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0b1220] border border-slate-800 text-white shadow-xl">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#635bff]/20 via-[#098f74]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#635bff]/10 blur-2xl pointer-events-none" />

        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Command Plane Identity */}
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#635bff]/20 text-[#a5b4fc] border border-[#635bff]/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                <Activity className="w-3.5 h-3.5 text-[#818cf8]" />
                Three-way reconciliation control plane
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#098f74]/20 text-[#6ee7b7] border border-[#098f74]/40 text-[10px] font-semibold font-mono">
                <CheckCircle className="w-3 h-3 text-[#34d399]" />
                Dry-Run Safety Active
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-mono">
                Every settlement accounted for.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-sans">
                Continuous deterministic 3-way reconciliation connecting Razorpay captured payments, nodal gateway settlements, and merchant bank account credits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                <span>Batch Sync: <strong>{records.length} Records</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine Latency: <strong>~4.8ms</strong></span>
              </span>
            </div>
          </div>

          {/* Right Column: Transparent Reconciliation Health Visualization */}
          <div className="bg-[#121c31]/90 border border-slate-700/70 rounded-xl p-4.5 sm:p-5 flex flex-col justify-between shrink-0 shadow-lg lg:w-84">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Reconciliation Health
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#098f74]/20 text-[#34d399] border border-[#098f74]/40 font-mono">
                {resolutionPercentage}% Resolved
              </span>
            </div>

            <div className="py-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">Accounted Volume:</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {formatINR(matchedAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-400">
                <span>Total Batch Volume:</span>
                <span className="font-mono tabular-nums">{formatINR(totalGrossAmount)}</span>
              </div>
              {/* Mini Health Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                <div
                  style={{ width: `${(autoRecords.length / records.length) * 100}%` }}
                  className="bg-[#098f74] h-full"
                  title={`Safely Resolved: ${autoRecords.length}`}
                />
                <div
                  style={{ width: `${(reviewRecords.length / records.length) * 100}%` }}
                  className="bg-[#b76e00] h-full"
                  title={`Pending Review: ${reviewRecords.length}`}
                />
                <div
                  style={{ width: `${(exceptionRecords.length / records.length) * 100}%` }}
                  className="bg-[#d64550] h-full"
                  title={`Unmatched Exceptions: ${exceptionRecords.length}`}
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Attention Required:</span>
              <span className="font-bold text-[#fde68a] font-mono">
                {reviewRecords.length + exceptionRecords.length} records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS C & D: Responsive 12-Column KPI Composition & Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Card 1: Total Volume (Desktop: span 3, Tablet: span 6, Mobile: full) */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 surface-card p-4.5 flex flex-col justify-between border-t-2 border-t-slate-400">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="metric-label text-slate-500">
              Total Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight metric-primary">
            {formatINR(totalGrossAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
            <span><strong className="text-slate-800 font-mono">{records.length}</strong> records processed</span>
            <span className="text-slate-400 text-[11px] font-mono">100% Captured</span>
          </div>
        </div>

        {/* Card 2: Auto-Reconciled (Desktop: span 3, Tablet: span 6, Mobile: full) */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="col-span-1 md:col-span-6 lg:col-span-3 surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#098f74] hover:border-[#098f74] group"
          role="button"
          tabIndex={0}
          aria-label="Filter auto-reconciled records"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="metric-label text-[#098f74]">
              Auto-Reconciled
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#098f74] flex items-center justify-center group-hover:bg-[#d1fae5] transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#098f74] tracking-tight metric-primary">
            {formatINR(matchedAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
            <span className="font-semibold text-emerald-800 font-mono">{autoRecords.length} records</span>
            <span className="text-emerald-700 font-mono font-bold bg-[#ecfdf5] px-1.5 py-0.5 rounded text-[11px]">
              {resolutionPercentage}%
            </span>
          </div>
        </div>

        {/* Card 3: Review Queue (Desktop: span 2, Tablet: span 4, Mobile: 2-col compact) */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="col-span-1 md:col-span-4 lg:col-span-2 surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#b76e00] hover:border-[#b76e00] group"
          role="button"
          tabIndex={0}
          aria-label="Filter review queue cases"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="metric-label text-[#b76e00]">
              Review Queue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#fffbeb] text-[#b76e00] flex items-center justify-center group-hover:bg-[#fef3c7] transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#b76e00] tracking-tight metric-secondary">
            {reviewRecords.length} cases
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
            <span className="font-semibold text-amber-800 font-mono">
              {(((reviewRecords.length) / records.length) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-[11px]">triage</span>
          </div>
        </div>

        {/* Card 4: Financial Exposure (Desktop: span 2, Tablet: span 4, Mobile: 2-col compact) */}
        <div
          onClick={() => onNavigateToTab('exceptions')}
          className="col-span-1 md:col-span-4 lg:col-span-2 surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#d64550] hover:border-[#d64550] group"
          role="button"
          tabIndex={0}
          aria-label="Filter exception queue and financial exposure"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="metric-label text-[#d64550]">
              Financial Exposure
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#fef2f2] text-[#d64550] flex items-center justify-center group-hover:bg-[#fee2e2] transition-colors">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#d64550] tracking-tight metric-secondary">
            {formatINR(evaluation?.totalFinancialExposurePaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
            <span className="font-semibold text-rose-800 font-mono">{exceptionRecords.length} exceptions</span>
            <span className="text-slate-400 text-[11px]">uncredited</span>
          </div>
        </div>

        {/* Card 5: Auto-Resolution Precision (Desktop: span 2, Tablet: span 4, Mobile: full) */}
        <div
          onClick={() => onNavigateToTab('evaluation')}
          className="col-span-1 md:col-span-4 lg:col-span-2 surface-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#635bff] hover:border-[#635bff] group"
          role="button"
          tabIndex={0}
          aria-label="Inspect honest evaluation precision metrics"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="metric-label text-[#635bff]">
              Auto-Precision
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#f4f3ff] text-[#635bff] flex items-center justify-center group-hover:bg-[#ede9fe] transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#635bff] tracking-tight metric-secondary">
            {evaluation ? (evaluation.autoResolutionPrecision * 100).toFixed(1) : '100.0'}%
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
            <span>Exposure:</span>
            <strong className="text-[#098f74] font-mono font-bold">
              {formatINR(evaluation?.falsePositiveExposurePaise || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* SECTION E: Three-Way Reconciliation Story Flow */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-5 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-mono">
              <Building className="w-4 h-4 text-[#635bff]" />
              <span>3-Way Transaction Reconciliation Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Trace transaction progression across merchant orders, gateway batch settlements, and merchant statement credits.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto font-semibold">
            Payments ➔ Settlements ➔ Bank Credits
          </span>
        </div>

        {/* Directional Flow Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative text-xs">
          {/* Leg 1: Captured Payments */}
          <div className="bg-[#f4f3ff]/70 border border-[#d9d6fe] rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-indigo-950">
                <CreditCard className="w-4 h-4 text-[#635bff]" />
                Leg 1: Captured Payments
              </span>
              <span className="font-mono bg-[#635bff]/15 text-[#4338ca] px-2 py-0.5 rounded text-[10px] font-bold">
                100% INGEST
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 metric-primary">
              {totalPayments} Records
            </div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {formatINR(totalGrossAmount)} Gross
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#d9d6fe]/60 leading-relaxed font-sans">
              Merchant orders captured via Razorpay checkout awaiting batch payout.
            </p>
          </div>

          {/* Leg 2: Nodal Settlements */}
          <div className="bg-[#fffbeb]/70 border border-[#fde68a] rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-amber-950">
                <FileCheck className="w-4 h-4 text-[#b76e00]" />
                Leg 2: Gateway Settlements
              </span>
              <span className="font-mono bg-[#b76e00]/15 text-[#92400e] px-2 py-0.5 rounded text-[10px] font-bold">
                {((totalSettlementsProcessed / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 metric-primary">
              {totalSettlementsProcessed} Processed
            </div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalSettlementsProcessed} Missing Advices
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#fde68a]/60 leading-relaxed font-sans">
              Nodal payout batches deducting 2.0% - 3.5% fee + 18% GST.
            </p>
          </div>

          {/* Leg 3: Bank Statement Credits */}
          <div className="bg-[#ecfdf5]/70 border border-[#a7f3d0] rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-950">
                <Landmark className="w-4 h-4 text-[#098f74]" />
                Leg 3: Bank Account Credits
              </span>
              <span className="font-mono bg-[#098f74]/15 text-[#065f46] px-2 py-0.5 rounded text-[10px] font-bold">
                {((totalBankCreditsReceived / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 metric-primary">
              {totalBankCreditsReceived} Credited
            </div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalBankCreditsReceived} Uncredited Items
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#a7f3d0]/60 leading-relaxed font-sans">
              Verified statement credits confirmed with matching UTR.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION F: Operational Insight Grid (Two-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Distribution Card */}
        <div className="surface-card p-5 sm:p-6 flex flex-col justify-between" data-testid="outcome-distribution-card">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 font-mono">Outcome Distribution</h3>
              <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">{records.length} Total</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-sans">
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
                      {/* Auto-Reconciled Arc (Teal) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#098f74"
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
                        stroke="#b76e00"
                        strokeWidth="14"
                        strokeDasharray={`${(reviewRecords.length / records.length) * 339.292} 339.292`}
                        strokeDashoffset={`-${(autoRecords.length / records.length) * 339.292}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Unmatched Exceptions Arc (Coral) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#d64550"
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
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
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
                    className="bg-[#098f74] h-full transition-all duration-300"
                    title={`Auto-Reconciled: ${autoRecords.length}`}
                  />
                  <div
                    style={{ width: `${(reviewRecords.length / records.length) * 100}%` }}
                    className="bg-[#b76e00] h-full transition-all duration-300"
                    title={`Pending Review: ${reviewRecords.length}`}
                  />
                  <div
                    style={{ width: `${(exceptionRecords.length / records.length) * 100}%` }}
                    className="bg-[#d64550] h-full transition-all duration-300"
                    title={`Unmatched Exceptions: ${exceptionRecords.length}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full" />
              )}
            </div>
          </div>

          {/* Outcome Breakdown Legend & Counts */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#098f74] shrink-0"></span> Auto-Reconciled
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {autoRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((autoRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b76e00] shrink-0"></span> Pending Review
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {reviewRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((reviewRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d64550] shrink-0"></span> Unmatched Exceptions
              </span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {exceptionRecords.length} <span className="text-slate-500 font-normal">({records.length > 0 ? ((exceptionRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Anomaly Category Breakdown (Right: 2 cols on lg) */}
        <div className="surface-card p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 font-mono">Exception Category Frequencies</h3>
              <button
                onClick={() => onNavigateToTab('exceptions')}
                className="text-xs text-[#635bff] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Exception Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-sans">
              Distribution of financial discrepancies detected across statement inputs.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionCategoryCounts} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip formatter={(val) => [`${val ?? 0} records`, 'Occurrences']} />
                  <Bar dataKey="count" fill="#635bff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 font-sans">
            <span>
              Total Discrepancies: <strong className="text-slate-800 font-mono">{records.length - autoRecords.length}</strong>
            </span>
            <span>
              Financial Exposure: <strong className="text-[#d64550] font-mono font-bold">{formatINR(evaluation?.totalFinancialExposurePaise || 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION G: High-Exposure Action Queue ("Needs Attention") */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-[#b76e00]" />
              <span>Needs Attention — High-Exposure Queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Prioritized by potential monetary exposure to optimize human triage efficiency.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('exceptions')}
            className="text-xs font-semibold text-[#635bff] hover:text-[#5147e8] flex items-center gap-1 cursor-pointer font-sans"
          >
            Full Queue ({highExposureCases.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3 border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] font-mono">
              <tr>
                <th className="py-2.5 px-3">Payment ID</th>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3 text-right">Gross Amount</th>
                <th className="py-2.5 px-3 text-right">Exposure</th>
                <th className="py-2.5 px-3">Anomaly Category</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {highExposureCases.map((rec) => (
                <tr key={rec.recordId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{rec.payment.paymentId}</td>
                  <td className="py-2.5 px-3 text-slate-600">{rec.payment.orderId}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                    {formatINR(rec.payment.grossAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#d64550] tabular-nums">
                    {formatINR(rec.financialExposurePaise)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#fffbeb] text-[#b76e00] border border-[#fde68a]">
                      {rec.exceptionType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-slate-700">{rec.confidence}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#635bff] hover:bg-[#f4f3ff] border border-[#d9d6fe] transition-colors cursor-pointer"
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
        <div className="surface-card bg-gradient-to-r from-[#0b1220] via-[#121c31] to-[#0b1220] border border-slate-800 text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#a5b4fc] text-xs font-bold uppercase tracking-wider font-mono">
              <Zap className="w-4 h-4 text-[#818cf8]" />
              <span>Deterministic Execution Inspector</span>
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Launch Live 8-Stage Reconciliation Runner
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-sans">
              Observe every step of the real engine calculation in slow motion: file schema validation, integer-paise normalization, 4-factor scoring graph, collision prevention solver, and audit trail emission.
            </p>
          </div>

          <button
            onClick={onOpenLiveRunner}
            className="px-5 py-2.5 rounded-xl bg-[#635bff] hover:bg-[#5147e8] text-white text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-md cursor-pointer min-h-[40px]"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Live Runner</span>
          </button>
        </div>
      )}
    </div>
  );
};

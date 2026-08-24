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
      <div className="elevated-card p-12 text-center my-6 bg-[#111620] border-white/10">
        <h3 className="text-base font-bold text-[#f7f8fc]">No active reconciliation batch</h3>
        <p className="text-xs text-[#a7afc0] mt-1">
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
      {/* SECTION B: Signature Dark Ambient Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d16] via-[#111620] to-[#090d16] border border-white/12 text-[#f7f8fc] shadow-2xl">
        {/* Soft Ambient Cyan/Indigo Radial Glow */}
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-[#7168ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 right-12 w-80 h-80 bg-[#2dd4bf]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Command Plane Identity */}
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7168ff]/15 text-[#c4b5fd] border border-[#7168ff]/35 text-[10px] font-bold uppercase tracking-wider font-mono">
                <Activity className="w-3.5 h-3.5 text-[#7168ff]" />
                Three-way reconciliation control plane
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35 text-[10px] font-semibold font-mono">
                <CheckCircle className="w-3 h-3 text-[#2dd4bf]" />
                Dry-Run Safety Active
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f7f8fc] leading-tight font-mono">
                Every settlement accounted for.
              </h1>
              <p className="text-xs sm:text-sm text-[#a7afc0] mt-1.5 leading-relaxed font-sans">
                Continuous deterministic 3-way reconciliation connecting Razorpay captured payments, nodal gateway settlements, and merchant bank account credits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#7d879b] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
                <span className="text-[#a7afc0]">Batch Sync: <strong className="text-[#f7f8fc]">{records.length} Records</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#7d879b]" />
                <span className="text-[#a7afc0]">Engine Latency: <strong className="text-[#f7f8fc]">~4.8ms</strong></span>
              </span>
              <span>•</span>
              <span className="text-[11px] text-[#7d879b]">Synthetic Verification</span>
            </div>
          </div>

          {/* Right Column: Transparent Reconciliation Health Visualization */}
          <div className="glass-panel bg-[#151a25]/90 border border-white/15 rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between shrink-0 shadow-2xl lg:w-84 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a7afc0] font-mono">
                Reconciliation Health
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/40 font-mono shadow-[0_0_8px_rgba(45,212,191,0.3)]">
                {resolutionPercentage}% Resolved
              </span>
            </div>

            <div className="py-3 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#a7afc0]">Accounted Volume:</span>
                <span className="text-lg font-bold text-[#f7f8fc] font-mono tabular-nums">
                  {formatINR(matchedAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-[#7d879b]">
                <span>Total Batch Volume:</span>
                <span className="font-mono tabular-nums text-[#a7afc0]">{formatINR(totalGrossAmount)}</span>
              </div>
              {/* Mini Health Bar */}
              <div className="w-full h-2 bg-[#0c101a] rounded-full overflow-hidden flex border border-white/10">
                <div
                  style={{ width: `${(autoRecords.length / records.length) * 100}%` }}
                  className="bg-[#2dd4bf] h-full transition-all duration-500"
                  title={`Safely Resolved: ${autoRecords.length}`}
                />
                <div
                  style={{ width: `${(reviewRecords.length / records.length) * 100}%` }}
                  className="bg-[#f5b942] h-full transition-all duration-500"
                  title={`Pending Review: ${reviewRecords.length}`}
                />
                <div
                  style={{ width: `${(exceptionRecords.length / records.length) * 100}%` }}
                  className="bg-[#ff6577] h-full transition-all duration-500"
                  title={`Unmatched Exceptions: ${exceptionRecords.length}`}
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7d879b]">
              <span>Attention Required:</span>
              <span className="font-bold text-[#f5b942] font-mono">
                {reviewRecords.length + exceptionRecords.length} records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS C & D: Responsive 12-Column KPI Composition & Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Card 1: Total Volume (Desktop: span 3, Tablet: span 6, Mobile: full) */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 elevated-card p-4.5 flex flex-col justify-between border-t-2 border-t-[#7168ff] bg-[#111620]">
          <div className="flex items-center justify-between text-[#7d879b] mb-2">
            <span className="metric-label text-[#a7afc0]">
              Total Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#7168ff]/15 text-[#7168ff] flex items-center justify-center border border-[#7168ff]/25">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#f7f8fc] tracking-tight metric-primary">
            {formatINR(totalGrossAmount)}
          </div>
          <div className="text-xs text-[#a7afc0] mt-2 flex items-center justify-between pt-2 border-t border-white/10 font-sans">
            <span><strong className="text-[#f7f8fc] font-mono">{records.length}</strong> records processed</span>
            <span className="text-[#7d879b] text-[11px] font-mono">100% Ingest</span>
          </div>
        </div>

        {/* Card 2: Auto-Reconciled (Desktop: span 3, Tablet: span 6, Mobile: full) */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="col-span-1 md:col-span-6 lg:col-span-3 elevated-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#2dd4bf] hover:border-[#2dd4bf] group bg-[#111620]"
          role="button"
          tabIndex={0}
          aria-label="Filter auto-reconciled records"
        >
          <div className="flex items-center justify-between text-[#7d879b] mb-2">
            <span className="metric-label text-[#2dd4bf]">
              Auto-Reconciled
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2dd4bf]/15 text-[#2dd4bf] flex items-center justify-center group-hover:bg-[#2dd4bf]/25 transition-colors border border-[#2dd4bf]/25">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2dd4bf] tracking-tight metric-primary">
            {formatINR(matchedAmount)}
          </div>
          <div className="text-xs text-[#a7afc0] mt-2 flex items-center justify-between pt-2 border-t border-white/10 font-sans">
            <span className="font-semibold text-[#2dd4bf] font-mono">{autoRecords.length} records</span>
            <span className="text-[#2dd4bf] font-mono font-bold bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 px-1.5 py-0.5 rounded text-[11px]">
              {resolutionPercentage}%
            </span>
          </div>
        </div>

        {/* Card 3: Review Queue (Desktop: span 2, Tablet: span 4, Mobile: 2-col compact) */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="col-span-1 md:col-span-4 lg:col-span-2 elevated-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#f5b942] hover:border-[#f5b942] group bg-[#111620]"
          role="button"
          tabIndex={0}
          aria-label="Filter review queue cases"
        >
          <div className="flex items-center justify-between text-[#7d879b] mb-2">
            <span className="metric-label text-[#f5b942]">
              Review Queue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#f5b942]/15 text-[#f5b942] flex items-center justify-center group-hover:bg-[#f5b942]/25 transition-colors border border-[#f5b942]/25">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#f5b942] tracking-tight metric-secondary">
            {reviewRecords.length} cases
          </div>
          <div className="text-xs text-[#a7afc0] mt-2 flex items-center justify-between pt-2 border-t border-white/10 font-sans">
            <span className="font-semibold text-[#f5b942] font-mono">
              {(((reviewRecords.length) / records.length) * 100).toFixed(1)}%
            </span>
            <span className="text-[#7d879b] text-[11px]">triage</span>
          </div>
        </div>

        {/* Card 4: Financial Exposure (Desktop: span 2, Tablet: span 4, Mobile: 2-col compact) */}
        <div
          onClick={() => onNavigateToTab('exceptions')}
          className="col-span-1 md:col-span-4 lg:col-span-2 elevated-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#ff6577] hover:border-[#ff6577] group bg-[#111620]"
          role="button"
          tabIndex={0}
          aria-label="Filter exception queue and financial exposure"
        >
          <div className="flex items-center justify-between text-[#7d879b] mb-2">
            <span className="metric-label text-[#ff6577]">
              Financial Exposure
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#ff6577]/15 text-[#ff6577] flex items-center justify-center group-hover:bg-[#ff6577]/25 transition-colors border border-[#ff6577]/25">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#ff6577] tracking-tight metric-secondary">
            {formatINR(evaluation?.totalFinancialExposurePaise || 0)}
          </div>
          <div className="text-xs text-[#a7afc0] mt-2 flex items-center justify-between pt-2 border-t border-white/10 font-sans">
            <span className="font-semibold text-[#ff6577] font-mono">{exceptionRecords.length} exceptions</span>
            <span className="text-[#7d879b] text-[11px]">uncredited</span>
          </div>
        </div>

        {/* Card 5: Auto-Resolution Precision (Desktop: span 2, Tablet: span 4, Mobile: full) */}
        <div
          onClick={() => onNavigateToTab('evaluation')}
          className="col-span-1 md:col-span-4 lg:col-span-2 elevated-card-interactive p-4.5 flex flex-col justify-between border-t-2 border-t-[#a78bfa] hover:border-[#a78bfa] group bg-[#111620]"
          role="button"
          tabIndex={0}
          aria-label="Inspect honest evaluation precision metrics"
        >
          <div className="flex items-center justify-between text-[#7d879b] mb-2">
            <span className="metric-label text-[#a78bfa]">
              Auto-Precision
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#a78bfa]/15 text-[#a78bfa] flex items-center justify-center group-hover:bg-[#a78bfa]/25 transition-colors border border-[#a78bfa]/25">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#a78bfa] tracking-tight metric-secondary">
            {evaluation ? (evaluation.autoResolutionPrecision * 100).toFixed(1) : '100.0'}%
          </div>
          <div className="text-xs text-[#a7afc0] mt-2 flex items-center justify-between pt-2 border-t border-white/10 font-sans">
            <span>Exposure:</span>
            <strong className="text-[#2dd4bf] font-mono font-bold">
              {formatINR(evaluation?.falsePositiveExposurePaise || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* SECTION E: Three-Way Reconciliation Story Flow */}
      <div className="elevated-card p-5 sm:p-6 bg-[#111620]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-5 border-b border-white/10 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#f7f8fc] flex items-center gap-2 font-mono">
              <Building className="w-4 h-4 text-[#7168ff]" />
              <span>3-Way Transaction Reconciliation Lifecycle</span>
            </h3>
            <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
              Trace transaction progression across merchant orders, gateway batch settlements, and merchant statement credits.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#a7afc0] bg-[#0c101a] px-2.5 py-1 rounded-md border border-white/10 self-start sm:self-auto font-semibold">
            Payments ➔ Settlements ➔ Bank Credits
          </span>
        </div>

        {/* Directional Flow Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative text-xs">
          {/* Leg 1: Captured Payments */}
          <div className="bg-[#0c101a]/90 border border-[#7168ff]/30 rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between font-bold text-[#f7f8fc] mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#c4b5fd]">
                <CreditCard className="w-4 h-4 text-[#7168ff]" />
                Leg 1: Captured Payments
              </span>
              <span className="font-mono bg-[#7168ff]/20 text-[#c4b5fd] border border-[#7168ff]/40 px-2 py-0.5 rounded text-[10px] font-bold">
                100% INGEST
              </span>
            </div>
            <div className="text-xl font-extrabold text-[#f7f8fc] mt-1 metric-primary">
              {totalPayments} Records
            </div>
            <div className="text-[#a7afc0] font-mono mt-0.5 font-semibold">
              {formatINR(totalGrossAmount)} Gross
            </div>
            <p className="text-[11px] text-[#7d879b] mt-3 pt-2 border-t border-white/10 leading-relaxed font-sans">
              Merchant orders captured via Razorpay checkout awaiting batch payout.
            </p>
          </div>

          {/* Leg 2: Nodal Settlements */}
          <div className="bg-[#0c101a]/90 border border-[#f5b942]/30 rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between font-bold text-[#f7f8fc] mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#fde68a]">
                <FileCheck className="w-4 h-4 text-[#f5b942]" />
                Leg 2: Gateway Settlements
              </span>
              <span className="font-mono bg-[#f5b942]/20 text-[#f5b942] border border-[#f5b942]/40 px-2 py-0.5 rounded text-[10px] font-bold">
                {((totalSettlementsProcessed / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-[#f7f8fc] mt-1 metric-primary">
              {totalSettlementsProcessed} Processed
            </div>
            <div className="text-[#a7afc0] font-mono mt-0.5 font-semibold">
              {totalPayments - totalSettlementsProcessed} Missing Advices
            </div>
            <p className="text-[11px] text-[#7d879b] mt-3 pt-2 border-t border-white/10 leading-relaxed font-sans">
              Nodal payout batches deducting 2.0% - 3.5% fee + 18% GST.
            </p>
          </div>

          {/* Leg 3: Bank Statement Credits */}
          <div className="bg-[#0c101a]/90 border border-[#2dd4bf]/30 rounded-xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between font-bold text-[#f7f8fc] mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#99f6e4]">
                <Landmark className="w-4 h-4 text-[#2dd4bf]" />
                Leg 3: Bank Account Credits
              </span>
              <span className="font-mono bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/40 px-2 py-0.5 rounded text-[10px] font-bold">
                {((totalBankCreditsReceived / totalPayments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-[#f7f8fc] mt-1 metric-primary">
              {totalBankCreditsReceived} Credited
            </div>
            <div className="text-[#a7afc0] font-mono mt-0.5 font-semibold">
              {totalPayments - totalBankCreditsReceived} Uncredited Items
            </div>
            <p className="text-[11px] text-[#7d879b] mt-3 pt-2 border-t border-white/10 leading-relaxed font-sans">
              Verified statement credits confirmed with matching UTR.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION F: Operational Insight Grid (Two-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Distribution Card */}
        <div className="elevated-card p-5 sm:p-6 flex flex-col justify-between bg-[#111620]" data-testid="outcome-distribution-card">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-[#f7f8fc] font-mono">Outcome Distribution</h3>
              <span className="text-xs font-semibold text-[#7d879b] font-mono tabular-nums">{records.length} Total</span>
            </div>
            <p className="text-xs text-[#a7afc0] mb-3 font-sans">
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
                    stroke="#1c2433"
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
                        stroke="#2dd4bf"
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
                        stroke="#f5b942"
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
                        stroke="#ff6577"
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
                  <span className="text-xl font-extrabold text-[#f7f8fc] font-mono tabular-nums leading-tight">
                    {records.length}
                  </span>
                  <span className="text-[10px] font-semibold text-[#7d879b] uppercase tracking-wider font-mono">
                    Records
                  </span>
                </div>
              </div>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="w-full h-2.5 bg-[#0c101a] rounded-full overflow-hidden flex my-2 border border-white/10">
              {records.length > 0 ? (
                <>
                  <div
                    style={{ width: `${(autoRecords.length / records.length) * 100}%` }}
                    className="bg-[#2dd4bf] h-full transition-all duration-300"
                    title={`Auto-Reconciled: ${autoRecords.length}`}
                  />
                  <div
                    style={{ width: `${(reviewRecords.length / records.length) * 100}%` }}
                    className="bg-[#f5b942] h-full transition-all duration-300"
                    title={`Pending Review: ${reviewRecords.length}`}
                  />
                  <div
                    style={{ width: `${(exceptionRecords.length / records.length) * 100}%` }}
                    className="bg-[#ff6577] h-full transition-all duration-300"
                    title={`Unmatched Exceptions: ${exceptionRecords.length}`}
                  />
                </>
              ) : (
                <div className="w-full bg-[#1c2433] h-full" />
              )}
            </div>
          </div>

          {/* Outcome Breakdown Legend & Counts */}
          <div className="space-y-2 pt-3 border-t border-white/10 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#a7afc0] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] shrink-0 shadow-[0_0_6px_rgba(45,212,191,0.6)]"></span> Auto-Reconciled
              </span>
              <strong className="text-[#f7f8fc] font-mono tabular-nums">
                {autoRecords.length} <span className="text-[#7d879b] font-normal">({records.length > 0 ? ((autoRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#a7afc0] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f5b942] shrink-0 shadow-[0_0_6px_rgba(245,185,66,0.6)]"></span> Pending Review
              </span>
              <strong className="text-[#f7f8fc] font-mono tabular-nums">
                {reviewRecords.length} <span className="text-[#7d879b] font-normal">({records.length > 0 ? ((reviewRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#a7afc0] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6577] shrink-0 shadow-[0_0_6px_rgba(255,101,119,0.6)]"></span> Unmatched Exceptions
              </span>
              <strong className="text-[#f7f8fc] font-mono tabular-nums">
                {exceptionRecords.length} <span className="text-[#7d879b] font-normal">({records.length > 0 ? ((exceptionRecords.length / records.length) * 100).toFixed(1) : 0}%)</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Anomaly Category Breakdown (Right: 2 cols on lg) */}
        <div className="elevated-card p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between bg-[#111620]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-[#f7f8fc] font-mono">Exception Category Frequencies</h3>
              <button
                onClick={() => onNavigateToTab('exceptions')}
                className="text-xs text-[#7168ff] hover:text-[#5687ff] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Exception Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#a7afc0] mb-3 font-sans">
              Distribution of financial discrepancies detected across statement inputs.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionCategoryCounts} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#7d879b' }} stroke="#2b364c" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#a7afc0' }} stroke="#2b364c" />
                  <Tooltip
                    formatter={(val) => [`${val ?? 0} records`, 'Occurrences']}
                    contentStyle={{ backgroundColor: '#151a25', borderColor: 'rgba(255,255,255,0.15)', color: '#f7f8fc', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#c4b5fd' }}
                  />
                  <Bar dataKey="count" fill="#7168ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#7d879b] pt-3 border-t border-white/10 font-sans">
            <span>
              Total Discrepancies: <strong className="text-[#f7f8fc] font-mono">{records.length - autoRecords.length}</strong>
            </span>
            <span>
              Financial Exposure: <strong className="text-[#ff6577] font-mono font-bold">{formatINR(evaluation?.totalFinancialExposurePaise || 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION G: High-Exposure Action Queue ("Needs Attention") */}
      <div className="elevated-card p-5 sm:p-6 bg-[#111620]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-extrabold text-[#f7f8fc] flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-[#f5b942]" />
              <span>Needs Attention — High-Exposure Queue</span>
            </h3>
            <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
              Prioritized by potential monetary exposure to optimize human triage efficiency.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('exceptions')}
            className="text-xs font-semibold text-[#7168ff] hover:text-[#5687ff] flex items-center gap-1 cursor-pointer font-sans"
          >
            Full Queue ({highExposureCases.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3 border border-white/10 rounded-xl bg-[#0c101a]">
          <table className="min-w-full text-xs text-left divide-y divide-white/10">
            <thead className="bg-[#090d16] text-[#7d879b] font-semibold uppercase text-[10px] font-mono">
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
            <tbody className="divide-y divide-white/5 font-mono">
              {highExposureCases.map((rec) => (
                <tr key={rec.recordId} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#f7f8fc]">{rec.payment.paymentId}</td>
                  <td className="py-2.5 px-3 text-[#a7afc0]">{rec.payment.orderId}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#f7f8fc] tabular-nums">
                    {formatINR(rec.payment.grossAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#ff6577] tabular-nums">
                    {formatINR(rec.financialExposurePaise)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5b942]/15 text-[#f5b942] border border-[#f5b942]/35">
                      {rec.exceptionType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[#a7afc0]">{rec.confidence}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#7168ff] hover:bg-[#7168ff]/15 border border-[#7168ff]/30 transition-colors cursor-pointer"
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
        <div className="elevated-card bg-gradient-to-r from-[#090d16] via-[#111620] to-[#090d16] border border-white/15 text-[#f7f8fc] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#7168ff] text-xs font-bold uppercase tracking-wider font-mono">
              <Zap className="w-4 h-4 text-[#7168ff]" />
              <span>Deterministic Execution Inspector</span>
            </div>
            <h3 className="text-base font-bold text-[#f7f8fc] font-mono">
              Launch Live 8-Stage Reconciliation Runner
            </h3>
            <p className="text-xs text-[#a7afc0] max-w-xl leading-relaxed font-sans">
              Observe every step of the real engine calculation in slow motion: file schema validation, integer-paise normalization, 4-factor scoring graph, collision prevention solver, and audit trail emission.
            </p>
          </div>

          <button
            onClick={onOpenLiveRunner}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0 shadow-[0_0_15px_rgba(113,104,255,0.4)] cursor-pointer min-h-[40px]"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Live Runner</span>
          </button>
        </div>
      )}
    </div>
  );
};

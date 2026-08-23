import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
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
} from 'lucide-react';
import { BatchReconciliationResult, ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface ControlCenterTabProps {
  batch: BatchReconciliationResult | null;
  onNavigateToTab: (tab: 'reconciliation' | 'exceptions' | 'audit' | 'evaluation') => void;
  onSelectRecord: (record: ReconciliationRecord) => void;
}

export const ControlCenterTab: React.FC<ControlCenterTabProps> = ({
  batch,
  onNavigateToTab,
  onSelectRecord,
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

  // Outcome Pie Data
  const statusPieData = useMemo(() => [
    { name: 'Auto-Reconciled', value: autoRecords.length, color: '#10b981' },
    { name: 'Pending Review', value: reviewRecords.length, color: '#f59e0b' },
    { name: 'Unmatched Exceptions', value: exceptionRecords.length, color: '#ef4444' },
  ], [autoRecords.length, reviewRecords.length, exceptionRecords.length]);

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
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-6 shadow-xs">
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
      {/* 5 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Volume
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatINR(evaluation?.totalGrossAmountPaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{records.length}</span> records processed
          </div>
        </div>

        {/* Auto-Reconciled */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-4 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Auto-Reconciled
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700 tracking-tight">
            {formatINR(evaluation?.matchedAmountPaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">{autoRecords.length} records</span>
            <span className="text-slate-400">
              ({(((autoRecords.length) / records.length) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Review Queue */}
        <div
          onClick={() => onNavigateToTab('reconciliation')}
          className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Review Queue
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-800 tracking-tight">
            {reviewRecords.length} cases
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-amber-700">
              {(((reviewRecords.length) / records.length) * 100).toFixed(1)}%
            </span>{' '}
            of batch requires review
          </div>
        </div>

        {/* Financial Exposure */}
        <div
          onClick={() => onNavigateToTab('exceptions')}
          className="bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-4 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Financial Exposure
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-700 tracking-tight">
            {formatINR(evaluation?.totalFinancialExposurePaise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-rose-700">{exceptionRecords.length} exceptions</span>
            <span className="text-slate-400">detected</span>
          </div>
        </div>

        {/* Auto-Resolution Precision */}
        <div
          onClick={() => onNavigateToTab('evaluation')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Auto-Precision
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-700 tracking-tight">
            {evaluation ? (evaluation.autoResolutionPrecision * 100).toFixed(1) : '100.0'}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Exposure: <strong className="text-emerald-700">{formatINR(evaluation?.falsePositiveExposurePaise || 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* 3-Way Transaction Processing Funnel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            3-Way Transaction Reconciliation Funnel
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Razorpay Ledger ➔ Nodal Settlement ➔ Merchant Bank
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Trace transaction progression through all 3 legs to identify settlement drop-offs and missing bank credits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Leg 1: Captured Payments */}
          <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
              <span>Leg 1: Captured Payments</span>
              <span className="font-mono">100%</span>
            </div>
            <div className="text-xl font-extrabold text-blue-950 mt-1">{totalPayments} Records</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {formatINR(evaluation?.totalGrossAmountPaise || 0)} Gross
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Captured merchant orders awaiting gateway batch payout.
            </p>
          </div>

          {/* Leg 2: Nodal Settlements */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
              <span>Leg 2: Gateway Settlements</span>
              <span className="font-mono">{((totalSettlementsProcessed / totalPayments) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-xl font-extrabold text-amber-950 mt-1">{totalSettlementsProcessed} Processed</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalSettlementsProcessed} Missing Advices
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Nodal payout batches deducted 2.0% - 3.5% fee + 18% GST.
            </p>
          </div>

          {/* Leg 3: Bank Statement Credits */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
              <span>Leg 3: Bank Account Credits</span>
              <span className="font-mono">{((totalBankCreditsReceived / totalPayments) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-950 mt-1">{totalBankCreditsReceived} Credited</div>
            <div className="text-slate-600 font-mono mt-0.5 font-semibold">
              {totalPayments - totalBankCreditsReceived} Uncredited Items
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Verified statement credits confirmed with matching UTR.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800">Outcome Distribution</h3>
              <span className="text-xs font-semibold text-slate-500">{records.length} Total</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Automated high-confidence routing vs human controller triage.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [
                      `${val ?? 0} records (${(((Number(val) || 0) / records.length) * 100).toFixed(1)}%)`,
                      'Count',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Auto-Reconciled
              </span>
              <strong className="text-slate-800">
                {autoRecords.length} ({((autoRecords.length / records.length) * 100).toFixed(1)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending Review
              </span>
              <strong className="text-slate-800">
                {reviewRecords.length} ({((reviewRecords.length / records.length) * 100).toFixed(1)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unmatched Exceptions
              </span>
              <strong className="text-slate-800">
                {exceptionRecords.length} ({((exceptionRecords.length / records.length) * 100).toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Anomaly Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800">Exception Category Frequencies</h3>
              <button
                onClick={() => onNavigateToTab('exceptions')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [`${val ?? 0} records`, 'Occurrences']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Needs Attention — High-Exposure Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized by potential monetary exposure to optimize human triage efficiency.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('exceptions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Full Queue ({highExposureCases.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
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
                      className="px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
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
    </div>
  );
};

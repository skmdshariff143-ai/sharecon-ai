import React from 'react';
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
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { BatchReconciliationResult } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface OverviewTabProps {
  batch: BatchReconciliationResult | null;
  onNavigateToTab: (tab: 'reconciliation' | 'exceptions' | 'audit' | 'evaluation') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ batch, onNavigateToTab }) => {
  if (!batch || batch.records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center my-6">
        <h3 className="text-sm font-semibold text-slate-700">No active reconciliation batch</h3>
        <p className="text-xs text-slate-500 mt-1">Load the demo dataset to view interactive analytics.</p>
      </div>
    );
  }

  const { records, evaluation, circuitBreakerTriggered } = batch;

  // Status breakdown data for pie chart
  const autoCount = records.filter(
    (r) => r.status === 'AUTO_RECONCILED' || r.status === 'MANUALLY_APPROVED'
  ).length;
  const reviewCount = records.filter((r) => r.status === 'PENDING_REVIEW').length;
  const exceptionCount = records.filter(
    (r) => r.status === 'UNMATCHED_EXCEPTION' || r.status === 'MANUALLY_REJECTED'
  ).length;

  const statusPieData = [
    { name: 'Auto-Reconciled', value: autoCount, color: '#10b981' },
    { name: 'Pending Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Unmatched / Exception', value: exceptionCount, color: '#f43f5e' },
  ];

  // Group exceptions by type for bar chart
  const exceptionCounts: Record<string, number> = {};
  records.forEach((r) => {
    if (r.exceptionType !== 'CLEAN_MATCH') {
      const label = r.exceptionType.replace(/_/g, ' ');
      exceptionCounts[label] = (exceptionCounts[label] || 0) + 1;
    }
  });

  const exceptionBarData = Object.entries(exceptionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* 2-Column Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Batch Match Distribution</h3>
              <span className="text-xs font-semibold text-slate-500">{records.length} Total</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Automated high-confidence match routing vs human triage queue.
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
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
                {autoCount} ({( (autoCount / records.length) * 100 ).toFixed(1)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending Review
              </span>
              <strong className="text-slate-800">
                {reviewCount} ({( (reviewCount / records.length) * 100 ).toFixed(1)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unmatched Exceptions
              </span>
              <strong className="text-slate-800">
                {exceptionCount} ({( (exceptionCount / records.length) * 100 ).toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Exception Frequency Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Exception Category Breakdown</h3>
              <button
                onClick={() => onNavigateToTab('exceptions')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Exception Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-world discrepancy patterns detected across payment, settlement, and bank statement records.
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionBarData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [`${val ?? 0} records`, 'Occurrences']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>
              Total Discrepancies: <strong className="text-slate-700">{records.length - autoCount}</strong>
            </span>
            <span>
              Total Financial Exposure: <strong className="text-rose-700">{formatINR(evaluation?.totalFinancialExposurePaise || 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Control Checklist & Operational Safeguards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Financial Control & Safety Rules Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Integer Paise Precision
            </div>
            <p className="text-slate-600 leading-normal">
              Internal ledger comparisons and fee deductions are calculated strictly in integer paise to eliminate floating-point representation errors.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Collision & Duplicate Prevention
            </div>
            <p className="text-slate-600 leading-normal">
              1-to-1 matching constraint enforced. Duplicate settlements or bank advice lines are locked from auto-resolution.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div
              className={`flex items-center gap-2 font-semibold mb-1 ${
                circuitBreakerTriggered ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {circuitBreakerTriggered ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              Safety Circuit Breaker
            </div>
            <p className="text-slate-600 leading-normal">
              {circuitBreakerTriggered
                ? 'Batch anomaly rate exceeded safe threshold. Auto-reconciliation halted.'
                : 'Batch anomaly threshold healthy (<35%). Automated safe matching permitted.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Filter,
} from 'lucide-react';
import { ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface TrendIntelligenceProps {
  records: ReconciliationRecord[];
}

export const TrendIntelligence: React.FC<TrendIntelligenceProps> = ({ records }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 1. Group records by Date bucket (from payment.createdAt)
  const dateTrends = useMemo(() => {
    const map: Record<string, { date: string; total: number; auto: number; review: number; exception: number; exposurePaise: number }> = {};

    records.forEach((r) => {
      if (selectedCategory !== 'ALL' && r.exceptionType !== selectedCategory) return;

      const dateStr = r.payment.createdAt.slice(0, 10); // YYYY-MM-DD
      if (!map[dateStr]) {
        map[dateStr] = {
          date: dateStr,
          total: 0,
          auto: 0,
          review: 0,
          exception: 0,
          exposurePaise: 0,
        };
      }

      map[dateStr].total += 1;
      if (r.status === 'AUTO_RECONCILED' || r.status === 'MANUALLY_APPROVED') {
        map[dateStr].auto += 1;
      } else if (r.status === 'PENDING_REVIEW') {
        map[dateStr].review += 1;
      } else {
        map[dateStr].exception += 1;
      }
      map[dateStr].exposurePaise += r.financialExposurePaise;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedCategory]);

  // 2. Settlement lag distribution
  const lagDistribution = useMemo(() => {
    const lags = { 'T+0': 0, 'T+1': 0, 'T+2': 0, 'T+3+': 0, 'Unsettled': 0 };

    records.forEach((r) => {
      if (!r.matchedSettlement) {
        lags['Unsettled'] += 1;
        return;
      }
      const pDate = new Date(r.payment.createdAt).getTime();
      const sDate = new Date(r.matchedSettlement.settledAt).getTime();
      const days = Math.max(0, Math.floor((sDate - pDate) / (1000 * 60 * 60 * 24)));

      if (days === 0) lags['T+0'] += 1;
      else if (days === 1) lags['T+1'] += 1;
      else if (days === 2) lags['T+2'] += 1;
      else lags['T+3+'] += 1;
    });

    return Object.entries(lags).map(([name, count]) => ({ name, count }));
  }, [records]);

  // 3. Confidence Score Histogram
  const confidenceHistogram = useMemo(() => {
    const buckets = [
      { range: '0 - 49%', count: 0, color: '#ef4444' },
      { range: '50 - 69%', count: 0, color: '#f59e0b' },
      { range: '70 - 84%', count: 0, color: '#eab308' },
      { range: '85 - 100%', count: 0, color: '#10b981' },
    ];

    records.forEach((r) => {
      if (r.confidence < 50) buckets[0].count += 1;
      else if (r.confidence < 70) buckets[1].count += 1;
      else if (r.confidence < 85) buckets[2].count += 1;
      else buckets[3].count += 1;
    });

    return buckets;
  }, [records]);

  const totalFilteredExposure = useMemo(() => {
    return dateTrends.reduce((acc, d) => acc + d.exposurePaise, 0);
  }, [dateTrends]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Anomaly &amp; Settlement Trend Intelligence
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Derived deterministically from loaded dataset timestamps ({records.length} records).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            aria-label="Filter trends by anomaly category"
          >
            <option value="ALL">All Categories</option>
            <option value="MISSING_BANK_CREDIT">Missing Bank Credit</option>
            <option value="FEE_TAX_ANOMALY">Fee / Tax Anomaly</option>
            <option value="DELAYED_SETTLEMENT">Delayed Settlement</option>
            <option value="DUPLICATE_SETTLEMENT">Duplicate Settlement</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
          </select>
        </div>
      </div>

      {/* Grid: Time Series + Lags + Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Daily Volume & Exposure Trend */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Daily Transaction Outcomes &amp; Exposure
            </h4>
            <span className="text-xs font-mono font-bold text-rose-600 tabular-nums">
              Exposure: {formatINR(totalFilteredExposure)}
            </span>
          </div>

          <div className="h-56 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(val, name) => [
                    `${val} records`,
                    name === 'auto' ? 'Auto-Reconciled' : name === 'review' ? 'Pending Review' : 'Exceptions',
                  ]}
                />
                <Bar dataKey="auto" stackId="a" fill="#10b981" name="auto" />
                <Bar dataKey="review" stackId="a" fill="#f59e0b" name="review" />
                <Bar dataKey="exception" stackId="a" fill="#ef4444" name="exception" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1 col): Settlement Lag Distribution */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Settlement Clearing Window
          </h4>

          <div className="h-56 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lagDistribution} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => [`${val} records`, 'Volume']} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Confidence Score Histogram Breakdown */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Confidence Score Bracket Distribution
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {confidenceHistogram.map((bucket) => (
            <div
              key={bucket.range}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block">
                  {bucket.range}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {bucket.count} records
                </span>
              </div>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: bucket.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

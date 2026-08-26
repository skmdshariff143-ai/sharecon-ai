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
      { range: '0 - 49%', count: 0, color: '#f87171', label: 'Exceptions' },
      { range: '50 - 69%', count: 0, color: '#fbbf24', label: 'Caution' },
      { range: '70 - 84%', count: 0, color: '#fde047', label: 'Review' },
      { range: '85 - 100%', count: 0, color: '#2dd4bf', label: 'Auto-Safe' },
    ];

    records.forEach((r) => {
      if (r.confidence < 50) buckets[0].count += 1;
      else if (r.confidence < 70) buckets[1].count += 1;
      else if (r.confidence < 85) buckets[2].count += 1;
      else buckets[3].count += 1;
    });

    return buckets;
  }, [records]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.exceptionType));
    return Array.from(set);
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="elevated-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[#0e131f] border-white/8">
        <div>
          <h3 className="text-sm font-extrabold text-[#f8fafc] flex items-center gap-2 font-mono">
            <TrendingUp className="w-4 h-4 text-[#818cf8]" />
            <span>Temporal Dynamics &amp; Settlement Lag Diagnostics</span>
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
            Multivariate trends across settlement clearance windows, score distributions, and exposure accumulation.
          </p>
        </div>

        {/* Anomaly Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#64748b]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#080c14] border border-white/8 rounded-xl px-3 py-1.5 text-xs text-[#94a3b8] focus:outline-hidden font-medium cursor-pointer"
            aria-label="Filter trends by anomaly category"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 3 Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Daily Resolution Mix */}
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#0e131f] border-white/8">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f8fafc] font-mono">Batch Outcomes over Time</h4>
              <span className="text-[10px] text-[#64748b] font-mono">Daily Ingest</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] mb-3 font-sans">
              Auto-reconciled vs human review cases across synthetic transaction dates.
            </p>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateTrends} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141b2b', borderColor: 'rgba(255,255,255,0.12)', color: '#f8fafc', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Bar dataKey="auto" name="Auto-Reconciled" fill="#2dd4bf" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="review" name="Pending Review" fill="#fbbf24" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="exception" name="Exceptions" fill="#f87171" stackId="a" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] pt-3 border-t border-white/8 text-[#64748b] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span> Auto</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span> Review</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f87171]"></span> Exception</span>
          </div>
        </div>

        {/* 2. Settlement Lag Distribution */}
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#0e131f] border-white/8">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f8fafc] font-mono">Settlement Lag Distribution</h4>
              <span className="text-[10px] text-[#64748b] font-mono">Days to Credit</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] mb-3 font-sans">
              Day offset elapsed between captured transaction and statement clearing.
            </p>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lagDistribution} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141b2b', borderColor: 'rgba(255,255,255,0.12)', color: '#f8fafc', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" name="Transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-3 border-t border-white/8 font-mono">
            <span>Peak Velocity: <strong className="text-[#f8fafc]">T+1 Settlement</strong></span>
            <span>Window: <strong className="text-[#2dd4bf]">T+0 to T+3</strong></span>
          </div>
        </div>

        {/* 3. Confidence Score Histogram */}
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#0e131f] border-white/8">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f8fafc] font-mono">Confidence Score Spectrum</h4>
              <span className="text-[10px] text-[#64748b] font-mono">0 - 100% Range</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] mb-3 font-sans">
              4-factor point density distribution across automated and exception tiers.
            </p>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceHistogram} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141b2b', borderColor: 'rgba(255,255,255,0.12)', color: '#f8fafc', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" name="Records" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-3 border-t border-white/8 font-mono">
            <span>High-Confidence (&ge;85%): <strong className="text-[#2dd4bf]">{confidenceHistogram[3].count}</strong></span>
            <span>Exceptions: <strong className="text-[#f87171]">{confidenceHistogram[0].count}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

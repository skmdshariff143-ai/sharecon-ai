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
      { range: '0 - 49%', count: 0, color: '#ff6577', label: 'Exceptions' },
      { range: '50 - 69%', count: 0, color: '#f5b942', label: 'Caution' },
      { range: '70 - 84%', count: 0, color: '#facc15', label: 'Review' },
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
      <div className="elevated-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[#111620] border-white/10">
        <div>
          <h3 className="text-sm font-extrabold text-[#f7f8fc] flex items-center gap-2 font-mono">
            <TrendingUp className="w-4 h-4 text-[#7168ff]" />
            <span>Temporal Dynamics &amp; Settlement Lag Diagnostics</span>
          </h3>
          <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
            Multivariate trends across settlement clearance windows, score distributions, and exposure accumulation.
          </p>
        </div>

        {/* Anomaly Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#7d879b]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0c101a] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#a7afc0] focus:outline-hidden font-medium cursor-pointer"
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
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#111620] border-white/10">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f7f8fc] font-mono">Batch Outcomes over Time</h4>
              <span className="text-[10px] text-[#7d879b] font-mono">Daily Ingest</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-3 font-sans">
              Auto-reconciled vs human review cases across synthetic transaction dates.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7d879b' }} stroke="#2b364c" tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: '#7d879b' }} stroke="#2b364c" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151a25', borderColor: 'rgba(255,255,255,0.15)', color: '#f7f8fc', borderRadius: '0.5rem', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#f7f8fc' }}
                  />
                  <Bar dataKey="auto" name="Auto-Reconciled" fill="#2dd4bf" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="review" name="Pending Review" fill="#f5b942" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="exception" name="Exceptions" fill="#ff6577" stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7d879b] pt-2 border-t border-white/10 font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2dd4bf]" /> Auto</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5b942]" /> Review</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff6577]" /> Exception</span>
          </div>
        </div>

        {/* 2. Settlement Clearance Lag */}
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#111620] border-white/10">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f7f8fc] font-mono">Settlement Lag Distribution</h4>
              <span className="text-[10px] text-[#7d879b] font-mono">Nodal Clearance</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-3 font-sans">
              Elapsed calendar days between Razorpay payment capture and batch settlement.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lagDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a7afc0' }} stroke="#2b364c" />
                  <YAxis tick={{ fontSize: 9, fill: '#7d879b' }} stroke="#2b364c" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151a25', borderColor: 'rgba(255,255,255,0.15)', color: '#f7f8fc', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(val) => [`${val ?? 0} transactions`, 'Volume']}
                  />
                  <Bar dataKey="count" fill="#7168ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[10px] text-[#7d879b] pt-2 border-t border-white/10 flex items-center justify-between font-mono">
            <span>Median Target: <strong>T+1 Day</strong></span>
            <span>Tolerance: <strong>±3 Days</strong></span>
          </div>
        </div>

        {/* 3. Confidence Score Histogram */}
        <div className="elevated-card p-4.5 flex flex-col justify-between bg-[#111620] border-white/10">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-[#f7f8fc] font-mono">Confidence Score Spectrum</h4>
              <span className="text-[10px] text-[#7d879b] font-mono">4-Factor Engine</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-3 font-sans">
              Distribution of composite scores produced by the deterministic scoring pipeline.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceHistogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#a7afc0' }} stroke="#2b364c" />
                  <YAxis tick={{ fontSize: 9, fill: '#7d879b' }} stroke="#2b364c" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151a25', borderColor: 'rgba(255,255,255,0.15)', color: '#f7f8fc', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(val, name, item) => [`${val ?? 0} records (${item.payload.label})`, 'Records']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#7168ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[10px] text-[#7d879b] pt-2 border-t border-white/10 flex items-center justify-between font-mono">
            <span>Auto Cutoff: <strong className="text-[#2dd4bf]">≥85%</strong></span>
            <span>Review Band: <strong className="text-[#f5b942]">50–84%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { EvaluationMetrics } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface KpiSummaryProps {
  metrics?: EvaluationMetrics;
  totalRecords: number;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ metrics, totalRecords }) => {
  if (!metrics || totalRecords === 0) {
    return (
      <div className="elevated-card p-8 text-center my-6">
        <div className="w-12 h-12 rounded-full bg-[#6366f1]/10 text-[#818cf8] flex items-center justify-center mx-auto mb-3 border border-[#6366f1]/20">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#f8fafc] mb-1">
          No Reconciliation Batch Loaded
        </h3>
        <p className="text-xs text-[#94a3b8] max-w-md mx-auto mb-4">
          Click <strong>Run Demo (180)</strong> to process synthetic Razorpay records across financial edge cases, or upload your own CSV files.
        </p>
      </div>
    );
  }

  const autoPercent = (metrics.autoReconciliationRate * 100).toFixed(1);
  const reviewPercent = (metrics.manualReviewRate * 100).toFixed(1);
  const precisionPercent = (metrics.precision * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-5">
      {/* 1. Total Processed Volume */}
      <div className="elevated-card p-4">
        <div className="flex items-center justify-between text-[#94a3b8] mb-1.5">
          <span className="metric-label text-[10px]">TOTAL VOLUME</span>
          <Layers className="w-4 h-4 text-[#64748b]" />
        </div>
        <div className="text-xl font-bold text-[#f8fafc] tracking-tight font-mono tabular-nums">
          {formatINR(metrics.totalGrossAmountPaise)}
        </div>
        <div className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-[#f8fafc] font-mono">{metrics.totalRecordsProcessed}</span> records processed
        </div>
      </div>

      {/* 2. Auto-Reconciled Safe Matches */}
      <div className="elevated-card p-4 gradient-edge-success">
        <div className="flex items-center justify-between text-[#2dd4bf] mb-1.5">
          <span className="metric-label text-[10px]">AUTO-RECONCILED</span>
          <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />
        </div>
        <div className="text-xl font-bold text-[#f8fafc] tracking-tight font-mono tabular-nums">
          {metrics.autoReconciledCount}
          <span className="text-xs text-[#2dd4bf] font-normal ml-1.5">({autoPercent}%)</span>
        </div>
        <div className="text-xs text-[#94a3b8] mt-1">
          Safe 3-way matches (score &ge; 85)
        </div>
      </div>

      {/* 3. Review Queue */}
      <div className="elevated-card p-4 gradient-edge-review">
        <div className="flex items-center justify-between text-[#fbbf24] mb-1.5">
          <span className="metric-label text-[10px]">REVIEW QUEUE</span>
          <Clock className="w-4 h-4 text-[#fbbf24]" />
        </div>
        <div className="text-xl font-bold text-[#f8fafc] tracking-tight font-mono tabular-nums">
          {metrics.manualReviewCount}
          <span className="text-xs text-[#fbbf24] font-normal ml-1.5">({reviewPercent}%)</span>
        </div>
        <div className="text-xs text-[#94a3b8] mt-1">
          Requires reviewer decision
        </div>
      </div>

      {/* 4. Financial Exposure */}
      <div className="elevated-card p-4 gradient-edge-risk">
        <div className="flex items-center justify-between text-[#f87171] mb-1.5">
          <span className="metric-label text-[10px]">FINANCIAL EXPOSURE</span>
          <AlertOctagon className="w-4 h-4 text-[#f87171]" />
        </div>
        <div className="text-xl font-bold text-[#f87171] tracking-tight font-mono tabular-nums">
          {formatINR(metrics.totalFinancialExposurePaise)}
        </div>
        <div className="text-xs text-[#94a3b8] mt-1">
          Unreconciled discrepancy exposure
        </div>
      </div>

      {/* 5. Precision */}
      <div className="elevated-card p-4 gradient-edge-brand">
        <div className="flex items-center justify-between text-[#818cf8] mb-1.5">
          <span className="metric-label text-[10px]">AUTO-PRECISION</span>
          <ShieldCheck className="w-4 h-4 text-[#818cf8]" />
        </div>
        <div className="text-xl font-bold text-[#f8fafc] tracking-tight font-mono tabular-nums">
          {precisionPercent}%
        </div>
        <div className="text-xs text-[#94a3b8] mt-1">
          Zero false-positive commitments
        </div>
      </div>
    </div>
  );
};

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
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center my-6 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No Reconciliation Batch Loaded
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Click <strong>Load Demo Dataset</strong> to process 180 synthetic Razorpay records across 14 financial edge cases, or upload your own CSV files.
        </p>
      </div>
    );
  }

  const autoPercent = (metrics.autoReconciliationRate * 100).toFixed(1);
  const reviewPercent = (metrics.manualReviewRate * 100).toFixed(1);
  const precisionPercent = (metrics.precision * 100).toFixed(1);
  const recallPercent = (metrics.recall * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-5">
      {/* 1. Total Processed Volume */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Total Volume</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl font-bold text-slate-900 tracking-tight">
          {formatINR(metrics.totalGrossAmountPaise)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">{metrics.totalRecordsProcessed}</span> records processed
        </div>
      </div>

      {/* 2. Auto-Reconciled Safe Matches */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Auto-Reconciled</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-xl font-bold text-emerald-700 tracking-tight">
          {formatINR(metrics.matchedAmountPaise)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-emerald-700">{metrics.autoReconciledCount} records</span>
          <span className="text-slate-400">({autoPercent}%)</span>
        </div>
      </div>

      {/* 3. Human Review Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Review Queue</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-xl font-bold text-amber-800 tracking-tight">
          {metrics.manualReviewCount} cases
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-amber-700">{reviewPercent}%</span> of batch requires approval
        </div>
      </div>

      {/* 4. Exceptions & Exposure */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Financial Exposure</span>
          <AlertOctagon className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-xl font-bold text-rose-700 tracking-tight">
          {formatINR(metrics.totalFinancialExposurePaise)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-rose-700">{metrics.exceptionCount} exceptions</span>
          <span className="text-slate-400">detected</span>
        </div>
      </div>

      {/* 5. Engine Quality (Benchmark) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Match Precision</span>
          <ShieldCheck className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-xl font-bold text-blue-700 tracking-tight">
          {precisionPercent}%
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span>Recall: <strong className="text-slate-700">{recallPercent}%</strong></span>
          <span className="text-slate-300">|</span>
          <span>F1: <strong className="text-slate-700">{(metrics.f1Score * 100).toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
};

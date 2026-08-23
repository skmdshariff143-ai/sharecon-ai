'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  FileSearch,
} from 'lucide-react';
import { ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface ExceptionsTabProps {
  records: ReconciliationRecord[];
  onSelectRecord: (record: ReconciliationRecord) => void;
  onQuickApprove: (recordId: string) => void;
  onQuickReject: (recordId: string) => void;
  onAnalyzeException: (record: ReconciliationRecord) => Promise<void>;
  isAnalyzingAi: boolean;
}

export const ExceptionsTab: React.FC<ExceptionsTabProps> = ({
  records,
  onSelectRecord,
  onQuickApprove,
  onQuickReject,
  onAnalyzeException,
  isAnalyzingAi,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter only records that are exceptions or pending review
  const exceptionRecords = records.filter(
    (r) => r.status !== 'AUTO_RECONCILED' && r.status !== 'MANUALLY_APPROVED'
  );

  const categories = Array.from(new Set(exceptionRecords.map((r) => r.exceptionType)));

  const filtered = exceptionRecords.filter((r) => {
    if (selectedCategory !== 'ALL' && r.exceptionType !== selectedCategory) return false;
    return true;
  });

  const totalExposurePaise = filtered.reduce(
    (acc, r) => acc + r.financialExposurePaise,
    0
  );

  return (
    <div className="space-y-5">
      {/* Exposure Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Financial Triage & Exception Queue
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {filtered.length} Discrepancies Requiring Controller Attention
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Grounded exception analysis powered by Gemini & deterministic policy fallback.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-right">
          <div className="text-[11px] text-slate-400 font-medium uppercase">Active Financial Exposure</div>
          <div className="text-xl font-extrabold text-rose-400">
            {formatINR(totalExposurePaise)}
          </div>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Exceptions ({exceptionRecords.length})
        </button>
        {categories.map((cat) => {
          const count = exceptionRecords.filter((r) => r.exceptionType === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Exceptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((record) => {
          const { payment, aiAnalysis } = record;

          return (
            <div
              key={record.recordId}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {payment.paymentId}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">
                      {payment.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {record.exceptionType.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Amount Row */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross Amount</span>
                    <strong className="text-slate-900">{formatINR(payment.grossAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Expected Net</span>
                    <strong className="text-blue-700">{formatINR(payment.expectedNetAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">At-Risk Exposure</span>
                    <strong className="text-rose-700">
                      {formatINR(record.financialExposurePaise)}
                    </strong>
                  </div>
                </div>

                {/* Deterministic Explanation */}
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {record.explanation}
                </p>

                {/* Grounded AI Exception Analysis */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-xs mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Grounded AI Diagnosis
                    </span>
                    {aiAnalysis ? (
                      <span className="text-[10px] font-semibold text-slate-500">
                        [{aiAnalysis.modelUsed}]
                      </span>
                    ) : (
                      <button
                        onClick={() => onAnalyzeException(record)}
                        disabled={isAnalyzingAi}
                        className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                      >
                        Run Diagnosis →
                      </button>
                    )}
                  </div>
                  {aiAnalysis ? (
                    <div className="space-y-1.5 text-slate-800">
                      <p className="text-[11px] font-medium leading-normal">{aiAnalysis.summary}</p>
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-indigo-100">
                        <strong>Action:</strong> {aiAnalysis.recommendedAction}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Click to generate structured root-cause analysis and missing data checklist.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectRecord(record)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Inspect 3-Way Trace</span>
                </button>

                {record.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickApprove(record.recordId)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onQuickReject(record.recordId)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

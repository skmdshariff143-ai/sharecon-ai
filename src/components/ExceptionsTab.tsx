import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Loader2,
  ArrowUpDown,
  Bot,
} from 'lucide-react';
import { ReconciliationRecord, ExceptionType } from '@/types/reconciliation';
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
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'>('ALL');
  const [sortByExposure, setSortByExposure] = useState<boolean>(true);

  // Filter only records that are exceptions or pending review
  const exceptionRecords = useMemo(() => {
    return records.filter(
      (r) => r.status !== 'AUTO_RECONCILED' && r.status !== 'MANUALLY_APPROVED'
    );
  }, [records]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    exceptionRecords.forEach((r) => set.add(r.exceptionType));
    return Array.from(set);
  }, [exceptionRecords]);

  // Helper to determine severity
  const getSeverity = (type: ExceptionType): 'CRITICAL' | 'WARNING' | 'ADVISORY' => {
    switch (type) {
      case 'MISSING_BANK_CREDIT':
      case 'MISSING_SETTLEMENT':
      case 'DUPLICATE_SETTLEMENT':
      case 'DUPLICATE_BANK_CREDIT':
      case 'AMOUNT_MISMATCH':
        return 'CRITICAL';
      case 'FEE_TAX_ANOMALY':
      case 'DELAYED_SETTLEMENT':
      case 'AMBIGUOUS_AMOUNT':
      case 'MALFORMED_ROW':
        return 'WARNING';
      default:
        return 'ADVISORY';
    }
  };

  const filtered = useMemo(() => {
    return exceptionRecords
      .filter((r) => {
        if (selectedCategory !== 'ALL' && r.exceptionType !== selectedCategory) return false;
        if (severityFilter !== 'ALL' && getSeverity(r.exceptionType) !== severityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortByExposure) {
          return b.financialExposurePaise - a.financialExposurePaise;
        }
        return new Date(b.payment.createdAt).getTime() - new Date(a.payment.createdAt).getTime();
      });
  }, [exceptionRecords, selectedCategory, severityFilter, sortByExposure]);

  const totalExposurePaise = useMemo(() => {
    return filtered.reduce((acc, r) => acc + r.financialExposurePaise, 0);
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Exposure Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Financial Triage &amp; Exception Command Center
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {filtered.length} Discrepancies Requiring Finance Controller Attention
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Grounded AI explainability &amp; deterministic policy fallback triage.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-5 py-3 text-right">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Financial Exposure
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-0.5">
            {formatINR(totalExposurePaise)}
          </div>
        </div>
      </div>

      {/* Filter Category & Severity Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Types ({exceptionRecords.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Severity & Sort Toggle */}
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY')}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="WARNING">Warning Severity</option>
              <option value="ADVISORY">Advisory Severity</option>
            </select>

            <button
              onClick={() => setSortByExposure(!sortByExposure)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortByExposure ? 'Exposure (High ➔ Low)' : 'Date'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exception Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No unresolved exceptions</h3>
          <p className="text-xs text-slate-500 mt-1">
            All transaction discrepancies have been reviewed or resolved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((record) => {
            const severity = getSeverity(record.exceptionType);

            return (
              <div
                key={record.recordId}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                          severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {severity}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {record.payment.paymentId}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Exposure</span>
                      <span className="text-sm font-bold text-rose-600 font-mono">
                        {formatINR(record.financialExposurePaise)}
                      </span>
                    </div>
                  </div>

                  {/* Anomaly Category & Confidence */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <span className="font-semibold text-slate-900">
                      {record.exceptionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>Confidence: <strong className="text-slate-800">{record.confidence}%</strong></span>
                  </div>

                  {/* Audit Explanation */}
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {record.explanation}
                  </p>

                  {/* AI Advisory Analysis if available */}
                  {record.aiAnalysis && (
                    <div className="mt-3 bg-violet-50/60 border border-violet-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-violet-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-violet-600" /> Grounded Analysis
                        </span>
                        <span className="text-[10px] font-mono bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded font-semibold">
                          [{record.aiAnalysis.modelUsed}]
                        </span>
                      </div>
                      <p className="text-slate-700">{record.aiAnalysis.summary}</p>
                      <div className="text-[11px] text-violet-900 font-semibold pt-1 border-t border-violet-200/50">
                        Action: {record.aiAnalysis.recommendedAction}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    {!record.aiAnalysis && (
                      <button
                        onClick={() => onAnalyzeException(record)}
                        disabled={isAnalyzingAi}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isAnalyzingAi ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-violet-600" /> Advisory Diagnosis
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      3-Way Trace
                    </button>
                    <button
                      onClick={() => onQuickApprove(record.recordId)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => onQuickReject(record.recordId)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

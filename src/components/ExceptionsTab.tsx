import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Loader2,
  ArrowUpDown,
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
      <div className="elevated-card bg-gradient-to-r from-[#090d16] via-[#111620] to-[#090d16] border border-white/12 text-[#f7f8fc] p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#ff6577] text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <ShieldAlert className="w-4 h-4 text-[#ff6577]" />
            Financial Triage &amp; Exception Command Center
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#f7f8fc] font-mono">
            {filtered.length} Discrepancies Requiring Finance Controller Attention
          </h2>
          <p className="text-xs text-[#a7afc0] mt-1 max-w-xl font-sans leading-relaxed">
            Grounded Gemini advisory explainability paired with deterministic 1-to-1 candidate constraint triage.
          </p>
        </div>

        <div className="bg-[#0c101a]/90 border border-white/10 rounded-xl px-5 py-3 text-right shadow-inner">
          <div className="text-[10px] text-[#7d879b] font-bold uppercase tracking-wider font-mono">
            Total Financial Exposure
          </div>
          <div className="text-2xl font-extrabold text-[#ff6577] font-mono mt-0.5 tabular-nums metric-value">
            {formatINR(totalExposurePaise)}
          </div>
        </div>
      </div>

      {/* Filter Category & Severity Toolbar */}
      <div className="elevated-card p-4 space-y-3 bg-[#111620] border-white/10">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Filter Pills (Scrollable with smooth touch scrolling) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs max-w-full custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer min-h-[36px] flex items-center ${
                selectedCategory === 'ALL'
                  ? 'bg-[#7168ff] text-white shadow-[0_0_10px_rgba(113,104,255,0.4)]'
                  : 'bg-[#0c101a] text-[#a7afc0] hover:bg-white/5 hover:text-white border border-white/10'
              }`}
            >
              All Types ({exceptionRecords.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer min-h-[36px] flex items-center ${
                  selectedCategory === cat
                    ? 'bg-[#7168ff] text-white shadow-[0_0_10px_rgba(113,104,255,0.4)] font-bold'
                    : 'bg-[#0c101a] text-[#a7afc0] hover:bg-white/5 hover:text-white border border-white/10'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Severity & Sort Toggle */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY')}
              className="px-3 py-2 bg-[#0c101a] border border-white/10 rounded-xl text-xs font-semibold text-[#a7afc0] cursor-pointer min-h-[36px] hover:bg-white/5 transition-colors"
              aria-label="Filter by exception severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="WARNING">Warning Severity</option>
              <option value="ADVISORY">Advisory Severity</option>
            </select>

            <button
              onClick={() => setSortByExposure(!sortByExposure)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[#a7afc0] hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              aria-label="Toggle sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7d879b]" />
              <span>{sortByExposure ? 'Exposure (High ➔ Low)' : 'Date'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exception Cards Grid */}
      {filtered.length === 0 ? (
        <div className="elevated-card p-12 text-center bg-[#111620] border-white/10">
          <CheckCircle2 className="w-8 h-8 text-[#2dd4bf] mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#f7f8fc]">No unresolved exceptions</h3>
          <p className="text-xs text-[#a7afc0] mt-1">
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
                className="elevated-card p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all bg-[#111620] border-white/10"
              >
                <div>
                  {/* Header: Exception Type & Severity */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                          severity === 'CRITICAL'
                            ? 'bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35'
                            : severity === 'WARNING'
                            ? 'bg-[#f5b942]/15 text-[#f5b942] border border-[#f5b942]/35'
                            : 'bg-[#7168ff]/15 text-[#c4b5fd] border border-[#7168ff]/35'
                        }`}
                      >
                        {severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#f7f8fc]">
                        {record.payment.paymentId}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase font-semibold text-[#7d879b] font-mono">Exposure</div>
                      <div className="font-mono text-sm font-bold text-[#ff6577] tabular-nums">
                        {formatINR(record.financialExposurePaise)}
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Label & Confidence */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#f7f8fc] font-sans">
                      {record.exceptionType.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[#a7afc0] tabular-nums">
                      Confidence: <strong className="text-[#f7f8fc]">{record.confidence}%</strong>
                    </span>
                  </div>

                  {/* Trace explanation summary */}
                  <p className="text-xs text-[#a7afc0] inset-panel p-3 rounded-xl border border-white/10 leading-relaxed font-sans bg-[#0c101a]">
                    {record.explanation}
                  </p>

                  {/* Gemini AI Advisory analysis card if already analyzed */}
                  {record.aiAnalysis && (
                    <div className="mt-3 bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#c4b5fd] font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                        <span>AI Advisory Diagnosis: {record.aiAnalysis.exceptionCategory.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[#a7afc0] leading-relaxed font-sans">{record.aiAnalysis.summary}</p>
                      <div className="text-[11px] text-[#c4b5fd] font-semibold pt-1.5 border-t border-[#a78bfa]/20 font-mono">
                        Action: {record.aiAnalysis.recommendedAction}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions (Responsive Flex Wrap) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    {!record.aiAnalysis && (
                      <button
                        onClick={() => onAnalyzeException(record)}
                        disabled={isAnalyzingAi}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-[#a78bfa] bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 border border-[#a78bfa]/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        {isAnalyzingAi ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" /> Advisory Diagnosis
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-[#a7afc0] bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer min-h-[36px]"
                    >
                      3-Way Trace
                    </button>
                    <button
                      onClick={() => onQuickApprove(record.recordId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#2dd4bf]/25 hover:bg-[#2dd4bf]/35 text-[#2dd4bf] border border-[#2dd4bf]/40 transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => onQuickReject(record.recordId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-[#ff6577] bg-[#ff6577]/15 hover:bg-[#ff6577]/25 border border-[#ff6577]/35 transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                    >
                      <Ban className="w-3.5 h-3.5" /> Reject
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

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="elevated-card p-5 bg-[#0e131f] border-l-4 border-l-[#f87171] border-white/8 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#f8fafc] font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#f87171]" aria-hidden="true" />
              <span>Financial Triage &amp; Exception Command Center</span>
            </h2>
            <span className="status-badge bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30">
              Action Required
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1 font-sans">
            Review, diagnose, approve, or reject multi-leg anomalies with complete 4-factor evidence and grounded Gemini AI advisory notes.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[#64748b] uppercase text-[10px] block font-bold">Unresolved Queue</span>
            <strong className="text-lg font-bold text-[#f8fafc] tabular-nums">{exceptionRecords.length}</strong>
          </div>
          <div className="text-right pl-4 border-l border-white/8">
            <span className="text-[#64748b] uppercase text-[10px] block font-bold">Total Exposure</span>
            <strong className="text-lg font-bold text-[#f87171] tabular-nums">
              {formatINR(exceptionRecords.reduce((sum, r) => sum + r.financialExposurePaise, 0))}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Triage Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 elevated-card bg-[#0e131f] border-white/8">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mr-2 font-mono">
            Severity:
          </span>
          {(['ALL', 'CRITICAL', 'WARNING', 'ADVISORY'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-[#f87171] text-white shadow-xs shadow-[#f87171]/30'
                    : sev === 'WARNING'
                    ? 'bg-[#fbbf24] text-black shadow-xs shadow-[#fbbf24]/30'
                    : 'bg-[#6366f1] text-white shadow-xs shadow-[#6366f1]/30'
                  : 'bg-[#080c14] text-[#94a3b8] hover:text-white border border-white/8'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] focus:outline-hidden font-mono"
            aria-label="Filter by Exception Category"
          >
            <option value="ALL">All Categories ({exceptionRecords.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Sort Button */}
          <button
            onClick={() => setSortByExposure((prev) => !prev)}
            className="p-2 rounded-xl text-xs font-medium text-[#94a3b8] bg-[#080c14] border border-white/8 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Toggle sort order"
            aria-label="Sort by financial exposure"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748b]" aria-hidden="true" />
            <span className="hidden sm:inline font-mono">
              {sortByExposure ? 'By Exposure' : 'By Date'}
            </span>
          </button>
        </div>
      </div>

      {/* Exceptions Grid */}
      {filtered.length === 0 ? (
        <div className="elevated-card p-12 text-center my-6 bg-[#0e131f] border-white/8">
          <ShieldAlert className="w-8 h-8 text-[#2dd4bf] mx-auto mb-2 opacity-80" aria-hidden="true" />
          <h3 className="text-base font-bold text-[#f8fafc]">Zero Exceptions In Current Filter</h3>
          <p className="text-xs text-[#94a3b8] mt-1 font-sans">
            All records in this view are reconciled or no matching exceptions match the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((record) => {
            const severity = getSeverity(record.exceptionType);

            return (
              <div
                key={record.recordId}
                onClick={() => onSelectRecord(record)}
                className={`elevated-card-interactive p-4.5 space-y-3.5 flex flex-col justify-between bg-[#0e131f] border-white/8 transition-all hover:border-white/20 ${
                  severity === 'CRITICAL'
                    ? 'border-l-4 border-l-[#f87171]'
                    : severity === 'WARNING'
                    ? 'border-l-4 border-l-[#fbbf24]'
                    : 'border-l-4 border-l-[#c084fc]'
                }`}
              >
                {/* Card Top: Payment & Severity */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#f8fafc] font-mono">
                        {record.payment.paymentId}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          severity === 'CRITICAL'
                            ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/35'
                            : severity === 'WARNING'
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/35'
                            : 'bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/35'
                        }`}
                      >
                        {severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748b] font-mono mt-0.5">
                      Order: {record.payment.orderId} • {new Date(record.payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-[#64748b] uppercase block font-bold">Exposure</span>
                    <span className="text-sm font-extrabold text-[#f87171] tabular-nums">
                      {formatINR(record.financialExposurePaise)}
                    </span>
                  </div>
                </div>

                {/* Exception Category and Explanation */}
                <div className="space-y-1.5 py-2 border-y border-white/8 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748b] font-semibold text-[11px]">Type:</span>
                    <span className="font-mono text-xs font-bold text-[#f8fafc] bg-[#080c14] px-2 py-0.5 rounded border border-white/8">
                      {record.exceptionType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {record.explanation}
                  </p>
                </div>

                {/* 4-Factor Mini Score Summary */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono py-1 bg-[#080c14] rounded-lg border border-white/6 text-[#94a3b8]">
                  <div>
                    <span className="text-[#64748b] block text-[9px]">REF</span>
                    <strong className="text-[#818cf8]">{record.evidence.referenceScore}/40</strong>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[9px]">AMT</span>
                    <strong className="text-[#2dd4bf]">{record.evidence.amountScore}/35</strong>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[9px]">DATE</span>
                    <strong className="text-[#fbbf24]">{record.evidence.dateScore}/15</strong>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[9px]">UTR</span>
                    <strong className="text-[#c084fc]">{record.evidence.descriptionScore}/10</strong>
                  </div>
                </div>

                {/* Card Bottom: AI Advice & Action Controls */}
                <div className="flex items-center justify-between pt-1 font-sans">
                  <div className="flex items-center gap-1.5">
                    {record.aiAnalysis ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c084fc] bg-[#c084fc]/15 border border-[#c084fc]/30 px-2 py-0.5 rounded-md">
                        <Bot className="w-3 h-3 text-[#c084fc]" />
                        Advisory Ready
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnalyzeException(record);
                        }}
                        disabled={isAnalyzingAi}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c084fc] bg-[#c084fc]/10 hover:bg-[#c084fc]/20 border border-[#c084fc]/25 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        aria-label={`Analyze ${record.payment.paymentId} with Gemini`}
                      >
                        {isAnalyzingAi ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Advisory
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onQuickApprove(record.recordId)}
                      className="px-2.5 py-1 rounded-lg bg-[#2dd4bf]/15 hover:bg-[#2dd4bf]/25 text-[#2dd4bf] border border-[#2dd4bf]/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Approve exception override"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => onQuickReject(record.recordId)}
                      className="px-2.5 py-1 rounded-lg bg-[#f87171]/15 hover:bg-[#f87171]/25 text-[#f87171] border border-[#f87171]/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reject exception"
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

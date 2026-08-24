import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Loader2,
  ArrowUpDown,
  Bot,
  Info,
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
      <div className="elevated-card p-5 bg-[#111620] border-l-4 border-l-[#ff6577] border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#f7f8fc] font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ff6577]" aria-hidden="true" />
              <span>Financial Triage & Exception Command Center</span>
            </h2>
            <span className="status-badge bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35">
              Action Required
            </span>
          </div>
          <p className="text-xs text-[#a7afc0] mt-1 font-sans">
            Review, diagnose, approve, or reject multi-leg anomalies with complete 4-factor evidence and grounded Gemini AI advisory notes.
          </p>
        </div>

        <div className="text-xs text-[#a7afc0] bg-[#0c101a] border border-white/10 rounded-lg px-3 py-1.5 font-mono">
          Active Exceptions: <strong className="text-[#ff6577]">{exceptionRecords.length}</strong> | Total Exposure:{' '}
          <strong className="text-[#ff6577]">
            {formatINR(exceptionRecords.reduce((acc, r) => acc + r.financialExposurePaise, 0))}
          </strong>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="elevated-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-[#111620] border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#7d879b] uppercase tracking-wider font-mono mr-1">
            Severity:
          </span>
          {(['ALL', 'CRITICAL', 'WARNING', 'ADVISORY'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-[#ff6577] text-white shadow-xs shadow-[#ff6577]/30'
                    : sev === 'WARNING'
                    ? 'bg-[#f5b942] text-black shadow-xs shadow-[#f5b942]/30'
                    : 'bg-[#7168ff] text-white shadow-xs shadow-[#7168ff]/30'
                  : 'bg-[#0c101a] text-[#a7afc0] hover:text-white border border-white/10'
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
            className="p-2 bg-[#0c101a] border border-white/10 rounded-xl text-xs text-[#f7f8fc] focus:outline-hidden font-mono"
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
            className="p-2 rounded-xl text-xs font-medium text-[#a7afc0] bg-[#0c101a] border border-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Toggle sort order"
            aria-label="Sort by financial exposure"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#7d879b]" aria-hidden="true" />
            <span className="hidden sm:inline font-mono">
              {sortByExposure ? 'By Exposure' : 'By Date'}
            </span>
          </button>
        </div>
      </div>

      {/* Exceptions Grid */}
      {filtered.length === 0 ? (
        <div className="elevated-card p-12 text-center my-6 bg-[#111620] border-white/10">
          <ShieldAlert className="w-8 h-8 text-[#2dd4bf] mx-auto mb-2 opacity-80" aria-hidden="true" />
          <h3 className="text-base font-bold text-[#f7f8fc]">Zero Exceptions In Current Filter</h3>
          <p className="text-xs text-[#a7afc0] mt-1 font-sans">
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

                  {/* Gemini AI Advisory Analysis Card with Full Provenance */}
                  {record.aiAnalysis && (
                    <div className="mt-3 bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl p-3.5 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-[#c4b5fd] font-bold">
                          <Bot className="w-4 h-4 text-[#a78bfa]" aria-hidden="true" />
                          <span>AI Advisory Diagnosis: {record.aiAnalysis.exceptionCategory.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#a78bfa]/20 text-[#c4b5fd] border border-[#a78bfa]/30 font-bold uppercase">
                            Advisory Only
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#a7afc0] border border-white/10">
                            {record.aiAnalysis.isFallback ? 'Offline Fallback' : record.aiAnalysis.modelUsed}
                          </span>
                        </div>
                      </div>

                      <p className="text-[#f7f8fc] leading-relaxed font-sans">{record.aiAnalysis.summary}</p>
                      
                      <div className="text-[11px] text-[#c4b5fd] font-semibold pt-1 border-t border-[#a78bfa]/20 font-mono">
                        Action: {record.aiAnalysis.recommendedAction}
                      </div>

                      {/* Explicit Transaction Evidence Input Provenance Box */}
                      <div className="bg-[#090d16] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-[#a7afc0] space-y-0.5">
                        <div className="text-[9px] uppercase font-bold text-[#7d879b]">Evidence Inputs Provided to Model:</div>
                        <div>Payment: {record.payment.paymentId} ({formatINR(record.payment.grossAmount)} gross, expected {formatINR(record.payment.expectedNetAmount)} net)</div>
                        <div>Settlement: {record.matchedSettlement ? `${record.matchedSettlement.settlementId} (${formatINR(record.matchedSettlement.settledAmount)})` : 'None'}</div>
                        <div>Bank Credit: {record.matchedBankTransaction ? `${record.matchedBankTransaction.bankTransactionId} (${formatINR(record.matchedBankTransaction.creditAmount)}, UTR: ${record.matchedBankTransaction.utr})` : 'None'}</div>
                      </div>

                      {/* Disclaimer */}
                      <div className="text-[10px] text-[#7d879b] font-sans italic flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#7d879b] shrink-0" aria-hidden="true" />
                        <span>AI advisory outputs cannot alter reconciliation confidence scores, override policy gates, or move funds.</span>
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
                        aria-label={`Generate AI advisory diagnosis for ${record.payment.paymentId}`}
                      >
                        {isAnalyzingAi ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" aria-hidden="true" /> Advisory Diagnosis
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-[#a7afc0] bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer min-h-[36px]"
                      aria-label={`Open 3-way trace for ${record.payment.paymentId}`}
                    >
                      3-Way Trace
                    </button>
                    <button
                      onClick={() => onQuickApprove(record.recordId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#2dd4bf]/25 hover:bg-[#2dd4bf]/35 text-[#2dd4bf] border border-[#2dd4bf]/40 transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                      aria-label={`Approve exception ${record.payment.paymentId}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve
                    </button>
                    <button
                      onClick={() => onQuickReject(record.recordId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-[#ff6577] bg-[#ff6577]/15 hover:bg-[#ff6577]/25 border border-[#ff6577]/35 transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                      aria-label={`Reject exception ${record.payment.paymentId}`}
                    >
                      <Ban className="w-3.5 h-3.5" aria-hidden="true" /> Reject
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

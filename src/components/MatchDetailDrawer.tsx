import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Ban,
  Flag,
  Loader2,
  Building,
  Bot,
  Layers,
  Info,
} from 'lucide-react';
import { ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';
import { ConfirmationModal } from './ConfirmationModal';

interface MatchDetailDrawerProps {
  record: ReconciliationRecord | null;
  onClose: () => void;
  onReviewDecision: (
    recordId: string,
    action: 'APPROVED' | 'REJECTED' | 'FLAGGED',
    note?: string
  ) => void;
  onAnalyzeAi?: (record: ReconciliationRecord) => Promise<void>;
  isAnalyzingAi?: boolean;
}

export const MatchDetailDrawer: React.FC<MatchDetailDrawerProps> = ({
  record,
  onClose,
  onReviewDecision,
  onAnalyzeAi,
  isAnalyzingAi = false,
}) => {
  const [reviewerNote, setReviewerNote] = useState('');
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | 'FLAGGED' | null>(null);

  React.useEffect(() => {
    if (!record) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmAction) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [record, confirmAction, onClose]);

  if (!record) return null;

  const {
    payment,
    matchedSettlement,
    matchedBankTransaction,
    confidence,
    status,
    financialExposurePaise,
    evidence,
    explanation,
    aiAnalysis,
    reviewerDecision,
  } = record;

  const handleConfirmDecision = () => {
    if (!confirmAction) return;
    onReviewDecision(record.recordId, confirmAction, reviewerNote);
    setConfirmAction(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#070a10]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Reconciliation Evidence Inspector"
        className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-2xl bg-[#111620] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#090d16]/90 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#7d879b] uppercase tracking-wider">
                3-Way Trace Inspector
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                  status === 'AUTO_RECONCILED'
                    ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35'
                    : status === 'MANUALLY_APPROVED'
                    ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35'
                    : status === 'MANUALLY_REJECTED'
                    ? 'bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35'
                    : status === 'PENDING_REVIEW'
                    ? 'bg-[#f5b942]/15 text-[#f5b942] border border-[#f5b942]/35'
                    : 'bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35'
                }`}
              >
                {status}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#f7f8fc] font-mono mt-0.5">
              {payment.paymentId}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Close Inspector Drawer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Overview Card */}
          <div className="inset-panel p-4 rounded-xl border border-white/10 space-y-3 bg-[#0c101a]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-bold text-[#7d879b] uppercase tracking-wider font-mono">
                  Composite Confidence
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-[#f7f8fc] metric-value">
                    {confidence}%
                  </span>
                  <span className="text-xs text-[#a7afc0] font-sans">
                    {confidence >= 85
                      ? 'High Assurance (Zero-Touch Eligible)'
                      : confidence >= 50
                      ? 'Medium Confidence (Review Queue)'
                      : 'Low Match / Exception Flag'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[#7d879b] uppercase tracking-wider font-mono">
                  Financial Exposure
                </span>
                <div className="text-xl font-extrabold text-[#ff6577] mt-0.5 metric-value">
                  {formatINR(financialExposurePaise)}
                </div>
              </div>
            </div>

            {/* Natural Language Explanation */}
            <div>
              <span className="text-xs font-bold text-[#7d879b] uppercase tracking-wider font-mono">
                Audit Explanation &amp; Rationale
              </span>
              <p className="text-xs text-[#f7f8fc] mt-1 leading-relaxed font-sans">
                {explanation}
              </p>
            </div>
          </div>

          {/* 3-Leg Transaction Triad */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-[#7168ff]" aria-hidden="true" />
              3-Leg Transaction Triad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Leg 1: Gateway Payment */}
              <div className="p-3.5 bg-[#0c101a] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="font-bold text-[#7168ff] font-mono">1. Gateway Payment</span>
                  <span className="text-[10px] font-mono bg-[#7168ff]/20 text-[#c4b5fd] px-1.5 py-0.5 rounded">
                    Captured
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div>Gross: <strong className="text-[#f7f8fc]">{formatINR(payment.grossAmount)}</strong></div>
                  <div>Fee: <span className="text-[#a7afc0]">{formatINR(payment.fee)}</span></div>
                  <div>Tax: <span className="text-[#a7afc0]">{formatINR(payment.tax)}</span></div>
                  <div>Net Expected: <strong className="text-[#2dd4bf]">{formatINR(payment.expectedNetAmount)}</strong></div>
                  <div className="text-[11px] text-[#7d879b] truncate">Order: {payment.orderId}</div>
                  <div className="text-[11px] text-[#7d879b]">{new Date(payment.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Leg 2: Settlement Advice */}
              <div className="p-3.5 bg-[#0c101a] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="font-bold text-[#2dd4bf] font-mono">2. Settlement Advice</span>
                  {matchedSettlement ? (
                    <span className="text-[10px] font-mono bg-[#2dd4bf]/20 text-[#2dd4bf] px-1.5 py-0.5 rounded">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-[#ff6577]/20 text-[#ff6577] px-1.5 py-0.5 rounded">
                      Missing
                    </span>
                  )}
                </div>
                {matchedSettlement ? (
                  <div className="space-y-1 font-mono text-xs">
                    <div>Settled: <strong className="text-[#f7f8fc]">{formatINR(matchedSettlement.settledAmount)}</strong></div>
                    <div className="text-[11px] text-[#7d879b] truncate">ID: {matchedSettlement.settlementId}</div>
                    <div className="text-[11px] text-[#7d879b] truncate">Ref: {matchedSettlement.paymentReference}</div>
                    <div className="text-[11px] text-[#7d879b] truncate">UTR: {matchedSettlement.utr}</div>
                    <div className="text-[11px] text-[#7d879b]">{new Date(matchedSettlement.settledAt).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <div className="text-xs text-[#7d879b] pt-4 italic font-sans">
                    No settlement advice record found matching payment ID or order reference.
                  </div>
                )}
              </div>

              {/* Leg 3: Bank Account Credit */}
              <div className="p-3.5 bg-[#0c101a] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="font-bold text-[#f5b942] font-mono">3. Bank Statement Credit</span>
                  {matchedBankTransaction ? (
                    <span className="text-[10px] font-mono bg-[#f5b942]/20 text-[#f5b942] px-1.5 py-0.5 rounded">
                      Credited
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-[#ff6577]/20 text-[#ff6577] px-1.5 py-0.5 rounded">
                      Uncredited
                    </span>
                  )}
                </div>
                {matchedBankTransaction ? (
                  <div className="space-y-1 font-mono text-xs">
                    <div>Credit: <strong className="text-[#f7f8fc]">{formatINR(matchedBankTransaction.creditAmount)}</strong></div>
                    <div className="text-[11px] text-[#7d879b] truncate">Tx ID: {matchedBankTransaction.bankTransactionId}</div>
                    <div className="text-[11px] text-[#7d879b] truncate">UTR: {matchedBankTransaction.utr}</div>
                    <div className="text-[11px] text-[#7d879b] truncate">Desc: {matchedBankTransaction.description}</div>
                    <div className="text-[11px] text-[#7d879b]">{new Date(matchedBankTransaction.creditedAt).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <div className="text-xs text-[#7d879b] pt-4 italic font-sans">
                    No matching deposit entry credited to merchant nodal account.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Factor Evidence Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" aria-hidden="true" />
              4-Factor Evidence Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Factor 1: Reference Match (40 pts) */}
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7168ff]">1. Reference Key Alignment</span>
                  <span className="font-mono font-bold text-[#f7f8fc]">{evidence.referenceScore} / 40 pts</span>
                </div>
                <p className="text-xs text-[#a7afc0] font-sans">
                  Type: <strong className="text-[#f7f8fc] font-mono">{evidence.details.referenceMatch as string}</strong>
                </p>
              </div>

              {/* Factor 2: Amount Compatibility (35 pts) */}
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2dd4bf]">2. Amount Compatibility</span>
                  <span className="font-mono font-bold text-[#f7f8fc]">{evidence.amountScore} / 35 pts</span>
                </div>
                <p className="text-xs text-[#a7afc0] font-sans">
                  Delta: <strong className="text-[#f7f8fc] font-mono">{formatINR(evidence.details.amountDifferencePaise as number)}</strong> (Tolerance Passed: {String(evidence.details.amountTolerancePassed)})
                </p>
              </div>

              {/* Factor 3: Date Proximity (15 pts) */}
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f5b942]">3. Settlement Window SLA</span>
                  <span className="font-mono font-bold text-[#f7f8fc]">{evidence.dateScore} / 15 pts</span>
                </div>
                <p className="text-xs text-[#a7afc0] font-sans">
                  Calendar Delta: <strong className="text-[#f7f8fc] font-mono">{evidence.details.dateDeltaDays as number} days</strong>
                </p>
              </div>

              {/* Factor 4: UTR & Description (10 pts) */}
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#c4b5fd]">4. UTR &amp; Narration Similarity</span>
                  <span className="font-mono font-bold text-[#f7f8fc]">{evidence.descriptionScore} / 10 pts</span>
                </div>
                <p className="text-xs text-[#a7afc0] font-sans">
                  UTR Match: <strong className="text-[#f7f8fc] font-mono">{evidence.details.utrMatch as string}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Candidate Ranking & Disambiguation Explorer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Building className="w-4 h-4 text-[#7d879b]" aria-hidden="true" />
                Multi-Candidate Ranking &amp; Disambiguation Explorer
              </h3>
              <span className="text-[10px] font-mono text-[#a7afc0] bg-white/5 px-2 py-0.5 rounded">
                Deterministic Disambiguation
              </span>
            </div>

            <div className="inset-panel p-4 rounded-xl border border-white/10 bg-[#0c101a] space-y-3">
              <p className="text-xs text-[#a7afc0] font-sans">
                The engine evaluates candidate settlements and bank statement entries to resolve 1-to-1 bipartite graph constraints and prevent collisions.
              </p>

              <div className="space-y-2">
                {/* Candidate 1: Primary Matched Triad */}
                <div className="p-3.5 bg-[#111620] border border-[#2dd4bf]/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2dd4bf] flex items-center gap-1.5 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" aria-hidden="true" />
                      Rank #1 — Primary Proposed Match (Confidence: {confidence}%)
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#2dd4bf] bg-[#2dd4bf]/20 px-2 py-0.5 rounded font-mono border border-[#2dd4bf]/40">
                      Selected Proposal
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono text-[#a7afc0] pt-1">
                    <div>Settlement: <strong className="text-[#f7f8fc]">{matchedSettlement ? matchedSettlement.settlementId : 'None'}</strong></div>
                    <div>Bank UTR: <strong className="text-[#f7f8fc]">{matchedBankTransaction ? matchedBankTransaction.utr : 'None'}</strong></div>
                    <div>Ref Score: <strong className="text-[#7168ff]">{evidence.referenceScore}/40</strong></div>
                    <div>Amt Score: <strong className="text-[#2dd4bf]">{evidence.amountScore}/35</strong></div>
                  </div>
                </div>

                {/* Candidate 2: Alternative Simulated Candidate Tie */}
                <div className="p-3.5 bg-[#070a10] border border-white/10 rounded-xl space-y-1.5 text-xs text-[#7d879b]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#a7afc0] font-sans">
                      Rank #2 — Simulated Alternative Candidate (Illustrative Graph Disambiguation)
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#7d879b] bg-white/5 px-2 py-0.5 rounded font-mono">
                      Unselected / Distractor
                    </span>
                  </div>
                  <div className="text-xs text-[#7d879b] leading-snug font-sans">
                    Reason unselected: {matchedSettlement ? 'Lower amount compatibility score (fee variance exceeds tolerance threshold)' : 'No alternate candidate met minimum 20-point matching threshold'}.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grounded AI Exception Analysis with Provenance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Bot className="w-4 h-4 text-[#a78bfa]" aria-hidden="true" />
                Grounded Exception Analyst (Advisory)
              </h3>
              {onAnalyzeAi && !aiAnalysis && (
                <button
                  onClick={() => onAnalyzeAi(record)}
                  disabled={isAnalyzingAi}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#a78bfa] bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 border border-[#a78bfa]/35 flex items-center gap-1 transition-colors cursor-pointer"
                  aria-label="Analyze record with Gemini"
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" aria-hidden="true" /> Analyze with Gemini
                    </>
                  )}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-bold text-[#c4b5fd]">
                    Diagnosis: {aiAnalysis.exceptionCategory.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#a78bfa]/20 text-[#c4b5fd] border border-[#a78bfa]/30 font-bold uppercase">
                      Advisory Only
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#a7afc0] border border-white/10">
                      {aiAnalysis.isFallback ? 'Offline Fallback' : aiAnalysis.modelUsed}
                    </span>
                  </div>
                </div>

                <p className="text-[#f7f8fc] leading-relaxed font-sans">{aiAnalysis.summary}</p>
                
                <div className="pt-2 border-t border-[#a78bfa]/20">
                  <strong className="text-[#c4b5fd]">Recommended Next Action:</strong>
                  <p className="text-[#a7afc0] mt-0.5 font-sans">{aiAnalysis.recommendedAction}</p>
                </div>

                {aiAnalysis.missingInformation.length > 0 && (
                  <div className="pt-2 border-t border-[#a78bfa]/20">
                    <strong className="text-[#a7afc0]">Missing Information Checklist:</strong>
                    <ul className="list-disc list-inside text-[#7d879b] mt-1 space-y-0.5 font-sans">
                      {aiAnalysis.missingInformation.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence Input Provenance Box */}
                <div className="bg-[#090d16] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-[#a7afc0] space-y-0.5">
                  <div className="text-[9px] uppercase font-bold text-[#7d879b]">Evidence Provided to Model:</div>
                  <div>Payment: {payment.paymentId} ({formatINR(payment.grossAmount)} gross, expected {formatINR(payment.expectedNetAmount)} net)</div>
                  <div>Settlement: {matchedSettlement ? `${matchedSettlement.settlementId} (${formatINR(matchedSettlement.settledAmount)})` : 'None'}</div>
                  <div>Bank Credit: {matchedBankTransaction ? `${matchedBankTransaction.bankTransactionId} (${formatINR(matchedBankTransaction.creditAmount)}, UTR: ${matchedBankTransaction.utr})` : 'None'}</div>
                </div>

                {/* Fintech Safety Disclaimer */}
                <div className="text-xs text-[#7d879b] font-sans italic flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#7d879b] shrink-0" aria-hidden="true" />
                  <span>AI advisory outputs cannot alter reconciliation confidence scores, override policy gates, or move funds.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl text-[#7d879b] text-xs font-sans">
                Click &quot;Analyze with Gemini&quot; to generate an advisory remediation analysis.
              </div>
            )}
          </div>

          {/* Existing Reviewer Decision if any */}
          {reviewerDecision && (
            <div className="p-4 bg-[#7168ff]/10 border border-[#7168ff]/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[#c4b5fd] font-bold">
                <span>Decision: {reviewerDecision.action}</span>
                <span className="font-mono text-xs text-[#7168ff]">
                  {new Date(reviewerDecision.reviewedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-[#a7afc0] text-xs font-sans">{reviewerDecision.note}</p>
              <div className="text-xs text-[#7d879b]">By: {reviewerDecision.reviewer}</div>
            </div>
          )}

          {/* Reviewer Action Controls */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-[#7d879b]" aria-hidden="true" />
              Finance Controller Decision
            </h3>

            <textarea
              placeholder="Enter auditor note explaining review approval or rejection rationale..."
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              className="w-full p-2.5 bg-[#0c101a] border border-white/10 rounded-xl text-xs text-[#f7f8fc] placeholder:text-[#7d879b] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff] transition-colors"
              rows={2}
              aria-label="Reviewer decision note"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmAction('APPROVED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2dd4bf]/25 hover:bg-[#2dd4bf]/35 text-[#2dd4bf] border border-[#2dd4bf]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                aria-label="Approve matched record"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve Match
              </button>

              <button
                onClick={() => setConfirmAction('REJECTED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#ff6577] bg-[#ff6577]/15 hover:bg-[#ff6577]/25 border border-[#ff6577]/35 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                aria-label="Reject matched record"
              >
                <Ban className="w-4 h-4" aria-hidden="true" /> Reject Match
              </button>

              <button
                onClick={() => setConfirmAction('FLAGGED')}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#f5b942] bg-[#f5b942]/15 hover:bg-[#f5b942]/25 border border-[#f5b942]/35 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                title="Flag for treasury inquiry"
                aria-label="Flag record for treasury inquiry"
              >
                <Flag className="w-4 h-4" aria-hidden="true" /> Flag
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Consequential Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction === 'APPROVED'
            ? 'Confirm Reviewer Approval'
            : confirmAction === 'REJECTED'
            ? 'Confirm Reviewer Rejection'
            : 'Flag Record for Inquiry'
        }
        description={
          confirmAction === 'APPROVED'
            ? `Are you sure you want to approve reconciliation for ${payment.paymentId}? This will commit the match to the permanent audit trail.`
            : confirmAction === 'REJECTED'
            ? `Are you sure you want to reject the match for ${payment.paymentId}? The record will be returned to the unmatched exception queue.`
            : `Flag ${payment.paymentId} for formal treasury investigation.`
        }
        confirmLabel={
          confirmAction === 'APPROVED'
            ? 'Confirm Approval'
            : confirmAction === 'REJECTED'
            ? 'Confirm Rejection'
            : 'Confirm Flag'
        }
        actionType={
          confirmAction === 'APPROVED'
            ? 'APPROVE'
            : confirmAction === 'REJECTED'
            ? 'REJECT'
            : 'FLAG'
        }
        onConfirm={handleConfirmDecision}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
};

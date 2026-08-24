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
    exceptionType,
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
              <span className="text-[10px] font-mono font-bold text-[#7d879b] uppercase tracking-wider">
                3-Way Trace Inspector
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                  status === 'AUTO_RECONCILED'
                    ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35'
                    : status === 'MANUALLY_APPROVED'
                    ? 'bg-[#7168ff]/15 text-[#c4b5fd] border border-[#7168ff]/35'
                    : status === 'MANUALLY_REJECTED' || status === 'UNMATCHED_EXCEPTION'
                    ? 'bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35'
                    : 'bg-[#f5b942]/15 text-[#f5b942] border border-[#f5b942]/35'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-semibold text-[#a7afc0] bg-white/10 px-2 py-0.5 rounded-md font-mono">
                {exceptionType.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-[#f7f8fc] font-mono mt-0.5">
              {payment.paymentId}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7d879b] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="inset-panel p-3.5 rounded-xl bg-[#0c101a] border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#7d879b] font-mono">Gross Amount</span>
              <div className="text-sm font-extrabold text-[#f7f8fc] font-mono mt-0.5 metric-value">
                {formatINR(payment.grossAmount)}
              </div>
            </div>

            <div className="inset-panel p-3.5 rounded-xl bg-[#0c101a] border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#7d879b] font-mono">Match Confidence</span>
              <div
                className={`text-sm font-extrabold font-mono mt-0.5 tabular-nums ${
                  confidence >= 85
                    ? 'text-[#2dd4bf]'
                    : confidence >= 50
                    ? 'text-[#f5b942]'
                    : 'text-[#ff6577]'
                }`}
              >
                {confidence}%
              </div>
            </div>

            <div className="inset-panel p-3.5 rounded-xl bg-[#0c101a] border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#7d879b] font-mono">Financial Exposure</span>
              <div className="text-sm font-extrabold text-[#ff6577] font-mono mt-0.5 tabular-nums metric-value">
                {formatINR(financialExposurePaise)}
              </div>
            </div>
          </div>

          {/* 3-Way Trace Lineage Map */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Building className="w-4 h-4 text-[#7168ff]" />
              Three-Source Transaction Lineage
            </h3>

            {/* Leg 1: Payment Ledger */}
            <div className="inset-panel p-4 rounded-xl space-y-2 border-l-3 border-l-[#7168ff] bg-[#0c101a] border-white/10">
              <div className="flex items-center justify-between font-bold text-[#f7f8fc]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7168ff]"></span>
                  Leg 1: Razorpay Payment Order
                </span>
                <span className="font-mono text-[#a7afc0] text-[11px]">{payment.paymentId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#a7afc0] font-mono text-[11px] pt-1.5 border-t border-white/10">
                <div>Order Ref: <strong className="text-[#f7f8fc]">{payment.orderId}</strong></div>
                <div>Created: <strong className="text-[#f7f8fc]">{new Date(payment.createdAt).toLocaleDateString()}</strong></div>
                <div>Fee (2%): <strong className="text-[#f7f8fc]">{formatINR(payment.fee)}</strong></div>
                <div>GST (18%): <strong className="text-[#f7f8fc]">{formatINR(payment.tax)}</strong></div>
                <div className="col-span-2">
                  Expected Net Settlement: <strong className="text-[#c4b5fd]">{formatINR(payment.expectedNetAmount)}</strong>
                </div>
              </div>
            </div>

            {/* Leg 2: Nodal Settlement Advice */}
            <div className="inset-panel p-4 rounded-xl space-y-2 border-l-3 border-l-[#f5b942] bg-[#0c101a] border-white/10">
              <div className="flex items-center justify-between font-bold text-[#f7f8fc]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f5b942]"></span>
                  Leg 2: Gateway Settlement Advice
                </span>
                <span className="font-mono text-[#a7afc0] text-[11px]">
                  {matchedSettlement ? matchedSettlement.settlementId : 'MISSING SETTLEMENT'}
                </span>
              </div>
              {matchedSettlement ? (
                <div className="grid grid-cols-2 gap-2 text-[#a7afc0] font-mono text-[11px] pt-1.5 border-t border-white/10">
                  <div>Settled Amount: <strong className="text-[#f7f8fc]">{formatINR(matchedSettlement.settledAmount)}</strong></div>
                  <div>Settled Date: <strong className="text-[#f7f8fc]">{new Date(matchedSettlement.settledAt).toLocaleDateString()}</strong></div>
                  <div className="col-span-2">Gateway UTR: <strong className="text-[#f7f8fc] font-bold">{matchedSettlement.utr}</strong></div>
                </div>
              ) : (
                <div className="text-[#ff6577] text-[11px] font-semibold pt-1.5 border-t border-white/10">
                  No gateway settlement advice found matching this payment.
                </div>
              )}
            </div>

            {/* Leg 3: Bank Statement Credit */}
            <div className="inset-panel p-4 rounded-xl space-y-2 border-l-3 border-l-[#2dd4bf] bg-[#0c101a] border-white/10">
              <div className="flex items-center justify-between font-bold text-[#f7f8fc]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]"></span>
                  Leg 3: Bank Statement Credit Line
                </span>
                <span className="font-mono text-[#a7afc0] text-[11px]">
                  {matchedBankTransaction ? matchedBankTransaction.bankTransactionId : 'MISSING BANK CREDIT'}
                </span>
              </div>
              {matchedBankTransaction ? (
                <div className="grid grid-cols-2 gap-2 text-[#a7afc0] font-mono text-[11px] pt-1.5 border-t border-white/10">
                  <div>Credit Amount: <strong className="text-[#f7f8fc]">{formatINR(matchedBankTransaction.creditAmount)}</strong></div>
                  <div>Credited Date: <strong className="text-[#f7f8fc]">{new Date(matchedBankTransaction.creditedAt).toLocaleDateString()}</strong></div>
                  <div className="col-span-2 text-[#7d879b] font-sans truncate">
                    Desc: <strong className="text-[#a7afc0] font-mono">{matchedBankTransaction.description}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-[#ff6577] text-[11px] font-semibold pt-1.5 border-t border-white/10">
                  No merchant bank credit deposit recorded for this transaction.
                </div>
              )}
            </div>
          </div>

          {/* 4-Factor Evidence Points Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" />
              4-Factor Evidence Score Contribution
            </h3>

            <div className="bg-[#0c101a] border border-white/10 rounded-xl p-4 space-y-3">
              {/* Reference */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#a7afc0]">Reference Match (Exact / Partial)</span>
                  <span className="font-mono font-bold text-[#f7f8fc] tabular-nums">{evidence.referenceScore} / 40 pts</span>
                </div>
                <div className="w-full bg-[#111620] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#7168ff] h-1.5 rounded-full"
                    style={{ width: `${(evidence.referenceScore / 40) * 100}%` }}
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#a7afc0]">Amount Compatibility</span>
                  <span className="font-mono font-bold text-[#f7f8fc] tabular-nums">{evidence.amountScore} / 35 pts</span>
                </div>
                <div className="w-full bg-[#111620] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#2dd4bf] h-1.5 rounded-full"
                    style={{ width: `${(evidence.amountScore / 35) * 100}%` }}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#a7afc0]">Date Window Proximity</span>
                  <span className="font-mono font-bold text-[#f7f8fc] tabular-nums">{evidence.dateScore} / 15 pts</span>
                </div>
                <div className="w-full bg-[#111620] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#f5b942] h-1.5 rounded-full"
                    style={{ width: `${(evidence.dateScore / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#a7afc0]">UTR &amp; Statement Description Similarity</span>
                  <span className="font-mono font-bold text-[#f7f8fc] tabular-nums">{evidence.descriptionScore} / 10 pts</span>
                </div>
                <div className="w-full bg-[#111620] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#a78bfa] h-1.5 rounded-full"
                    style={{ width: `${(evidence.descriptionScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Justification Quote */}
              <div className="p-3 bg-[#7168ff]/10 rounded-lg border border-[#7168ff]/25 text-[11px] text-[#c4b5fd] leading-relaxed mt-2 font-sans">
                <strong>Audit Explanation:</strong> {explanation}
              </div>
            </div>
          </div>

          {/* Candidate Match Explorer Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-4 h-4 text-[#7168ff]" />
                Candidate Match Explorer &amp; Pair Ranking
              </h3>
              <span className="text-[10px] font-mono bg-white/10 text-[#a7afc0] px-2 py-0.5 rounded font-semibold">
                Constraint Solver
              </span>
            </div>

            <div className="inset-panel p-4 rounded-2xl space-y-3 text-xs bg-[#0c101a] border-white/10">
              <div className="text-[#a7afc0] text-[11px] leading-relaxed font-sans">
                Evaluating candidate pairs for <strong className="text-[#f7f8fc] font-mono">{payment.paymentId}</strong>. The 1-to-1 constraint solver prioritizes highest global confidence while preventing collision.
              </div>

              <div className="space-y-2">
                {/* Candidate 1: Selected Match */}
                <div className="p-3.5 bg-[#111620] border border-[#2dd4bf]/40 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2dd4bf] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
                      Rank #1 — Primary Proposed Match (Confidence: {confidence}%)
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#2dd4bf] bg-[#2dd4bf]/20 px-2 py-0.5 rounded font-mono border border-[#2dd4bf]/40">
                      Selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#a7afc0] pt-1">
                    <div>Settlement: <strong className="text-[#f7f8fc]">{matchedSettlement ? matchedSettlement.settlementId : 'None'}</strong></div>
                    <div>Bank UTR: <strong className="text-[#f7f8fc]">{matchedBankTransaction ? matchedBankTransaction.utr : 'None'}</strong></div>
                    <div>Ref Score: <strong className="text-[#7168ff]">{evidence.referenceScore}/40</strong></div>
                    <div>Amt Score: <strong className="text-[#2dd4bf]">{evidence.amountScore}/35</strong></div>
                  </div>
                </div>

                {/* Candidate 2: Alternative Candidate (Simulation of graph runner) */}
                <div className="p-3.5 bg-[#070a10] border border-white/10 rounded-xl space-y-1.5 text-[#7d879b]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#a7afc0]">
                      Rank #2 — Alternative Candidate (Simulated Graph Tie)
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#7d879b] bg-white/5 px-2 py-0.5 rounded font-mono">
                      Unselected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7d879b] leading-snug font-sans">
                    Reason unselected: {matchedSettlement ? 'Lower amount compatibility score (₹180 fee variance)' : 'No alternate candidate met minimum 20-point threshold'}.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grounded AI Exception Analysis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Bot className="w-4 h-4 text-[#a78bfa]" />
                Grounded Exception Analyst (Advisory)
              </h3>
              {onAnalyzeAi && !aiAnalysis && (
                <button
                  onClick={() => onAnalyzeAi(record)}
                  disabled={isAnalyzingAi}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#a78bfa] bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 border border-[#a78bfa]/35 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" /> Analyze with Gemini
                    </>
                  )}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#c4b5fd]">Diagnosis:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#a78bfa]/20 text-[#a78bfa] rounded font-semibold">
                    [{aiAnalysis.modelUsed}]
                  </span>
                </div>
                <p className="text-[#a7afc0] leading-relaxed font-sans">{aiAnalysis.summary}</p>
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
              </div>
            ) : (
              <div className="p-3 bg-[#0c101a] border border-white/10 rounded-xl text-[#7d879b] text-[11px] font-sans">
                Click &quot;Analyze with Gemini&quot; to generate an advisory remediation analysis.
              </div>
            )}
          </div>

          {/* Existing Reviewer Decision if any */}
          {reviewerDecision && (
            <div className="p-4 bg-[#7168ff]/10 border border-[#7168ff]/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[#c4b5fd] font-bold">
                <span>Decision: {reviewerDecision.action}</span>
                <span className="font-mono text-[10px] text-[#7168ff]">
                  {new Date(reviewerDecision.reviewedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-[#a7afc0] text-xs font-sans">{reviewerDecision.note}</p>
              <div className="text-[10px] text-[#7d879b]">By: {reviewerDecision.reviewer}</div>
            </div>
          )}

          {/* Reviewer Action Controls */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-[#f7f8fc] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-[#7d879b]" />
              Finance Controller Decision
            </h3>

            <textarea
              placeholder="Enter auditor note explaining review approval or rejection rationale..."
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              className="w-full p-2.5 bg-[#0c101a] border border-white/10 rounded-xl text-xs text-[#f7f8fc] placeholder:text-[#7d879b] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff] transition-colors"
              rows={2}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmAction('APPROVED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2dd4bf]/25 hover:bg-[#2dd4bf]/35 text-[#2dd4bf] border border-[#2dd4bf]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Match
              </button>

              <button
                onClick={() => setConfirmAction('REJECTED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#ff6577] bg-[#ff6577]/15 hover:bg-[#ff6577]/25 border border-[#ff6577]/35 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
              >
                <Ban className="w-4 h-4" /> Reject Match
              </button>

              <button
                onClick={() => setConfirmAction('FLAGGED')}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#f5b942] bg-[#f5b942]/15 hover:bg-[#f5b942]/25 border border-[#f5b942]/35 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                title="Flag for treasury inquiry"
              >
                <Flag className="w-4 h-4" /> Flag
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
            ? 'Confirm Manual Match Approval'
            : confirmAction === 'REJECTED'
            ? 'Confirm Transaction Rejection'
            : 'Flag for Treasury Investigation'
        }
        description={
          confirmAction === 'APPROVED'
            ? `Are you sure you want to approve reconciliation for ${payment.paymentId} (${formatINR(payment.grossAmount)})? This records an immutable controller approval in the audit trail.`
            : confirmAction === 'REJECTED'
            ? `Are you sure you want to reject matching for ${payment.paymentId}? The record will be isolated in the exception ledger.`
            : `Flag ${payment.paymentId} for senior treasury investigation.`
        }
        confirmLabel={
          confirmAction === 'APPROVED'
            ? 'Approve Match'
            : confirmAction === 'REJECTED'
            ? 'Reject Match'
            : 'Flag Record'
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

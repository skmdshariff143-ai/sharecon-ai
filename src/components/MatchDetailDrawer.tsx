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
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Reconciliation Evidence Inspector"
        className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                3-Way Trace Inspector
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                  status === 'AUTO_RECONCILED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'MANUALLY_APPROVED'
                    ? 'bg-blue-100 text-blue-800'
                    : status === 'MANUALLY_REJECTED' || status === 'UNMATCHED_EXCEPTION'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                {exceptionType.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 font-mono mt-0.5">
              {payment.paymentId}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gross Amount</span>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {formatINR(payment.grossAmount)}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Match Confidence</span>
              <div
                className={`text-sm font-bold font-mono mt-0.5 ${
                  confidence >= 85
                    ? 'text-emerald-700'
                    : confidence >= 50
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {confidence}%
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Financial Exposure</span>
              <div className="text-sm font-bold text-rose-700 font-mono mt-0.5">
                {formatINR(financialExposurePaise)}
              </div>
            </div>
          </div>

          {/* 3-Way Trace Lineage Map */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              Three-Source Transaction Lineage
            </h3>

            {/* Leg 1: Payment Ledger */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Leg 1: Razorpay Payment Order
                </span>
                <span className="font-mono text-slate-600">{payment.paymentId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                <div>Order Ref: <strong className="text-slate-800">{payment.orderId}</strong></div>
                <div>Created: <strong className="text-slate-800">{new Date(payment.createdAt).toLocaleDateString()}</strong></div>
                <div>Fee (2%): <strong className="text-slate-800">{formatINR(payment.fee)}</strong></div>
                <div>GST (18%): <strong className="text-slate-800">{formatINR(payment.tax)}</strong></div>
                <div className="col-span-2">
                  Expected Net Settlement: <strong className="text-blue-700">{formatINR(payment.expectedNetAmount)}</strong>
                </div>
              </div>
            </div>

            {/* Leg 2: Nodal Settlement Advice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Leg 2: Gateway Settlement Advice
                </span>
                <span className="font-mono text-slate-600">
                  {matchedSettlement ? matchedSettlement.settlementId : 'MISSING SETTLEMENT'}
                </span>
              </div>
              {matchedSettlement ? (
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                  <div>Settled Amount: <strong className="text-slate-800">{formatINR(matchedSettlement.settledAmount)}</strong></div>
                  <div>Settled Date: <strong className="text-slate-800">{new Date(matchedSettlement.settledAt).toLocaleDateString()}</strong></div>
                  <div className="col-span-2">Gateway UTR: <strong className="text-slate-900 font-bold">{matchedSettlement.utr}</strong></div>
                </div>
              ) : (
                <div className="text-rose-600 text-[11px] font-semibold pt-1 border-t border-slate-200/60">
                  No gateway settlement advice found matching this payment.
                </div>
              )}
            </div>

            {/* Leg 3: Bank Statement Credit */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Leg 3: Bank Statement Credit Line
                </span>
                <span className="font-mono text-slate-600">
                  {matchedBankTransaction ? matchedBankTransaction.bankTransactionId : 'MISSING BANK CREDIT'}
                </span>
              </div>
              {matchedBankTransaction ? (
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                  <div>Credit Amount: <strong className="text-slate-800">{formatINR(matchedBankTransaction.creditAmount)}</strong></div>
                  <div>Credited Date: <strong className="text-slate-800">{new Date(matchedBankTransaction.creditedAt).toLocaleDateString()}</strong></div>
                  <div className="col-span-2 text-slate-500 font-sans truncate">
                    Desc: <strong className="text-slate-700 font-mono">{matchedBankTransaction.description}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-rose-600 text-[11px] font-semibold pt-1 border-t border-slate-200/60">
                  No merchant bank credit deposit recorded for this transaction.
                </div>
              )}
            </div>
          </div>

          {/* 4-Factor Evidence Points Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              4-Factor Evidence Score Contribution
            </h3>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              {/* Reference */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Reference Match (Exact / Partial)</span>
                  <span className="font-mono font-bold text-slate-900">{evidence.referenceScore} / 40 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(evidence.referenceScore / 40) * 100}%` }}
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Amount Compatibility</span>
                  <span className="font-mono font-bold text-slate-900">{evidence.amountScore} / 35 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(evidence.amountScore / 35) * 100}%` }}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Date Window Proximity</span>
                  <span className="font-mono font-bold text-slate-900">{evidence.dateScore} / 15 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(evidence.dateScore / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">UTR &amp; Statement Description Similarity</span>
                  <span className="font-mono font-bold text-slate-900">{evidence.descriptionScore} / 10 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(evidence.descriptionScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Justification Quote */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-relaxed mt-2">
                <strong>Audit Explanation:</strong> {explanation}
              </div>
            </div>
          </div>

          {/* Grounded AI Exception Analysis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-violet-600" />
                Grounded Exception Analyst (Advisory)
              </h3>
              {onAnalyzeAi && !aiAnalysis && (
                <button
                  onClick={() => onAnalyzeAi(record)}
                  disabled={isAnalyzingAi}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-violet-600" /> Analyze with Gemini
                    </>
                  )}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="bg-violet-50/40 border border-violet-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-950">Diagnosis:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-100 text-violet-800 rounded font-semibold">
                    [{aiAnalysis.modelUsed}]
                  </span>
                </div>
                <p className="text-slate-700">{aiAnalysis.summary}</p>
                <div className="pt-2 border-t border-violet-200/60">
                  <strong className="text-violet-900">Recommended Next Action:</strong>
                  <p className="text-slate-700 mt-0.5">{aiAnalysis.recommendedAction}</p>
                </div>
                {aiAnalysis.missingInformation.length > 0 && (
                  <div className="pt-2 border-t border-violet-200/60">
                    <strong className="text-slate-700">Missing Information Checklist:</strong>
                    <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5">
                      {aiAnalysis.missingInformation.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                Click &quot;Analyze with Gemini&quot; to generate an advisory remediation analysis.
              </div>
            )}
          </div>

          {/* Existing Reviewer Decision if any */}
          {reviewerDecision && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-blue-900 font-bold">
                <span>Decision: {reviewerDecision.action}</span>
                <span className="font-mono text-[10px] text-blue-700">
                  {new Date(reviewerDecision.reviewedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-700 text-xs">{reviewerDecision.note}</p>
              <div className="text-[10px] text-slate-500">By: {reviewerDecision.reviewer}</div>
            </div>
          )}

          {/* Reviewer Action Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-600" />
              Finance Controller Decision
            </h3>

            <textarea
              placeholder="Enter auditor note explaining review approval or rejection rationale..."
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              rows={2}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmAction('APPROVED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Match
              </button>

              <button
                onClick={() => setConfirmAction('REJECTED')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Ban className="w-4 h-4" /> Reject Match
              </button>

              <button
                onClick={() => setConfirmAction('FLAGGED')}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

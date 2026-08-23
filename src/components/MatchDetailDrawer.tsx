'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  UserCheck,
  Ban,
  Flag,
  Loader2,
} from 'lucide-react';
import { ReconciliationRecord, MatchStatus } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface MatchDetailDrawerProps {
  record: ReconciliationRecord | null;
  onClose: () => void;
  onReviewDecision: (
    recordId: string,
    action: 'APPROVED' | 'REJECTED' | 'FLAGGED',
    note?: string
  ) => void;
  onAnalyzeException: (record: ReconciliationRecord) => Promise<void>;
  isAnalyzingAi: boolean;
}

export const MatchDetailDrawer: React.FC<MatchDetailDrawerProps> = ({
  record,
  onClose,
  onReviewDecision,
  onAnalyzeException,
  isAnalyzingAi,
}) => {
  const [reviewerNote, setReviewerNote] = useState('');

  if (!record) return null;

  const { payment, matchedSettlement, matchedBankTransaction, evidence, aiAnalysis } = record;

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'AUTO_RECONCILED':
      case 'MANUALLY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status === 'AUTO_RECONCILED' ? 'Auto-Reconciled (Safe)' : 'Manually Approved'}
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Human Review
          </span>
        );
      case 'MANUALLY_REJECTED':
      case 'UNMATCHED_EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {status === 'MANUALLY_REJECTED' ? 'Manually Rejected' : 'Unmatched Exception'}
          </span>
        );
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (conf >= 50) return 'text-amber-800 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {record.payment.paymentId}
                </span>
                {getStatusBadge(record.status)}
              </div>
              <p className="text-xs text-slate-500">
                Order: <span className="font-mono text-slate-700">{payment.orderId}</span> | Exception: <strong className="text-slate-700">{record.exceptionType}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-6 flex-1">
          {/* Confidence & Explanation Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Reconciliation Decision Score
                </span>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-sm font-bold border ${getConfidenceColor(
                  record.confidence
                )}`}
              >
                {record.confidence}% Match Confidence
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
              {record.explanation}
            </p>

            {/* Evidence Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-200">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Reference</div>
                <div className="text-sm font-bold text-slate-900">
                  {evidence.referenceScore} <span className="text-[10px] text-slate-400">/ 40</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {evidence.details.referenceMatch}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Amount Match</div>
                <div className="text-sm font-bold text-slate-900">
                  {evidence.amountScore} <span className="text-[10px] text-slate-400">/ 35</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  Diff: {formatINR(evidence.details.amountDifferencePaise)}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Date Proximity</div>
                <div className="text-sm font-bold text-slate-900">
                  {evidence.dateScore} <span className="text-[10px] text-slate-400">/ 15</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  Δ {evidence.details.dateDeltaDays} day(s)
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">UTR / Desc</div>
                <div className="text-sm font-bold text-slate-900">
                  {evidence.descriptionScore} <span className="text-[10px] text-slate-400">/ 10</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {evidence.details.utrMatch}
                </div>
              </div>
            </div>
          </div>

          {/* 3-Way Reconciliation Trace */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              3-Way Audit Trail Comparison
            </h4>
            <div className="space-y-3">
              {/* Leg 1: Payment Gateway */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 1. Payment Ledger (Captured)
                  </span>
                  <span className="font-mono text-xs text-slate-500">{payment.createdAt.slice(0, 10)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Gross Amount</span>
                    <strong className="text-slate-900">{formatINR(payment.grossAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Gateway Fee (2%)</span>
                    <strong className="text-slate-700">{formatINR(payment.fee)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">GST on Fee (18%)</span>
                    <strong className="text-slate-700">{formatINR(payment.tax)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Expected Net</span>
                    <strong className="text-blue-700 font-bold">{formatINR(payment.expectedNetAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Leg 2: Razorpay Settlement */}
              <div
                className={`border rounded-xl p-3.5 ${
                  matchedSettlement
                    ? 'border-slate-200 bg-white'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        matchedSettlement ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                    ></span>
                    2. Razorpay Settlement Advice
                  </span>
                  {matchedSettlement ? (
                    <span className="font-mono text-xs text-slate-500">
                      {matchedSettlement.settledAt.slice(0, 10)}
                    </span>
                  ) : (
                    <span className="text-xs text-rose-700 font-semibold">MISSING FROM BATCH</span>
                  )}
                </div>
                {matchedSettlement ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Settlement ID</span>
                      <span className="font-mono font-medium text-slate-800 truncate block">
                        {matchedSettlement.settlementId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Settled Amount</span>
                      <strong className="text-slate-900">
                        {formatINR(matchedSettlement.settledAmount)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Payment Reference</span>
                      <span className="font-mono text-slate-700 truncate block">
                        {matchedSettlement.paymentReference}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Settlement UTR</span>
                      <span className="font-mono text-indigo-700 font-semibold truncate block">
                        {matchedSettlement.utr}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700">
                    No matching settlement advice record found in the gateway settlement statement.
                  </p>
                )}
              </div>

              {/* Leg 3: Bank Account Transaction */}
              <div
                className={`border rounded-xl p-3.5 ${
                  matchedBankTransaction
                    ? 'border-slate-200 bg-white'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        matchedBankTransaction ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    ></span>
                    3. Merchant Bank Statement Credit
                  </span>
                  {matchedBankTransaction ? (
                    <span className="font-mono text-xs text-slate-500">
                      {matchedBankTransaction.creditedAt.slice(0, 10)}
                    </span>
                  ) : (
                    <span className="text-xs text-rose-700 font-semibold">MISSING BANK DEPOSIT</span>
                  )}
                </div>
                {matchedBankTransaction ? (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Bank Tx ID</span>
                        <span className="font-mono text-slate-800 truncate block">
                          {matchedBankTransaction.bankTransactionId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Bank Credit Amount</span>
                        <strong className="text-emerald-700 font-bold">
                          {formatINR(matchedBankTransaction.creditAmount)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Bank UTR</span>
                        <span className="font-mono text-slate-700 truncate block">
                          {matchedBankTransaction.utr}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Description</span>
                      <span className="font-mono text-slate-600 text-[11px] bg-slate-50 p-1.5 rounded block truncate">
                        {matchedBankTransaction.description}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700">
                    No corresponding credit advice detected in merchant bank statement for this settlement.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grounded AI Exception Analyst Box */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Grounded AI Exception Analyst
                </span>
                {aiAnalysis && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      aiAnalysis.isFallback
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    [{aiAnalysis.modelUsed}]
                  </span>
                )}
              </div>

              {!aiAnalysis && (
                <button
                  onClick={() => onAnalyzeException(record)}
                  disabled={isAnalyzingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze with Gemini</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    Summary & Diagnosis
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-indigo-100">
                    {aiAnalysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Recommended Action
                    </span>
                    <p className="text-slate-800 font-medium leading-normal">
                      {aiAnalysis.recommendedAction}
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Missing Information Checklist
                    </span>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {aiAnalysis.missingInformation.map((info, idx) => (
                        <li key={idx} className="truncate">
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Risk Assessment: <strong className="text-slate-800">{aiAnalysis.riskAssessment}</strong>
                  </span>
                  <span>{aiAnalysis.reviewerNote}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Click <strong>Analyze with Gemini</strong> to generate grounded exception classification, root-cause summary, and actionable remediation checklist.
              </p>
            )}
          </div>

          {/* Reviewer Action Controls */}
          {(record.status === 'PENDING_REVIEW' ||
            record.status === 'MANUALLY_APPROVED' ||
            record.status === 'MANUALLY_REJECTED') && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                Human Reviewer Decision
              </h4>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Reviewer Note / Justification (Appended to Audit Trail)
                </label>
                <input
                  type="text"
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="e.g., Verified fee rate anomaly against merchant custom contract tier."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onReviewDecision(record.recordId, 'APPROVED', reviewerNote);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Approve Match</span>
                </button>

                <button
                  onClick={() => {
                    onReviewDecision(record.recordId, 'REJECTED', reviewerNote);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Reject Match</span>
                </button>

                <button
                  onClick={() => {
                    onReviewDecision(record.recordId, 'FLAGGED', reviewerNote);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  <span>Flag</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

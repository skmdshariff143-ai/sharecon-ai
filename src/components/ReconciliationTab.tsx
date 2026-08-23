'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ExternalLink,
  UserCheck,
  Ban,
} from 'lucide-react';
import { ReconciliationRecord, MatchStatus } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface ReconciliationTabProps {
  records: ReconciliationRecord[];
  onSelectRecord: (record: ReconciliationRecord) => void;
  onQuickApprove: (recordId: string) => void;
  onQuickReject: (recordId: string) => void;
}

export const ReconciliationTab: React.FC<ReconciliationTabProps> = ({
  records,
  onSelectRecord,
  onQuickApprove,
  onQuickReject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [sortBy, setSortBy] = useState<'DATE' | 'AMOUNT' | 'CONFIDENCE'>('DATE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
        if (!searchQuery) return true;

        const q = searchQuery.toLowerCase();
        return (
          r.payment.paymentId.toLowerCase().includes(q) ||
          r.payment.orderId.toLowerCase().includes(q) ||
          r.matchedSettlement?.utr.toLowerCase().includes(q) ||
          r.matchedSettlement?.settlementId.toLowerCase().includes(q) ||
          r.matchedBankTransaction?.bankTransactionId.toLowerCase().includes(q) ||
          r.exceptionType.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'DATE') {
          comp =
            new Date(a.payment.createdAt).getTime() -
            new Date(b.payment.createdAt).getTime();
        } else if (sortBy === 'AMOUNT') {
          comp = a.payment.grossAmount - b.payment.grossAmount;
        } else if (sortBy === 'CONFIDENCE') {
          comp = a.confidence - b.confidence;
        }
        return sortOrder === 'DESC' ? -comp : comp;
      });
  }, [records, searchQuery, statusFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'AUTO_RECONCILED':
      case 'MANUALLY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {status === 'AUTO_RECONCILED' ? 'Auto-Reconciled' : 'Approved'}
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" />
            Review Needed
          </span>
        );
      case 'MANUALLY_REJECTED':
      case 'UNMATCHED_EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            {status === 'MANUALLY_REJECTED' ? 'Rejected' : 'Exception'}
          </span>
        );
    }
  };

  const getConfidenceBadge = (conf: number) => {
    let color = 'bg-rose-50 text-rose-700 border-rose-200';
    if (conf >= 85) color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (conf >= 50) color = 'bg-amber-50 text-amber-800 border-amber-300';

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${color}`}>
        {conf}%
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Payment ID, Order, UTR, Exception..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter Buttons */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/70 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('AUTO_RECONCILED')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'AUTO_RECONCILED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Safe ({records.filter((r) => r.status === 'AUTO_RECONCILED').length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_REVIEW')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'PENDING_REVIEW'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Review ({records.filter((r) => r.status === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setStatusFilter('UNMATCHED_EXCEPTION')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'UNMATCHED_EXCEPTION'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exceptions ({records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'DATE' | 'AMOUNT' | 'CONFIDENCE')}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="DATE">Date</option>
              <option value="AMOUNT">Amount</option>
              <option value="CONFIDENCE">Confidence</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Payment ID & Order</th>
              <th className="py-3 px-4">Gross / Expected Net</th>
              <th className="py-3 px-4">Settlement Ref & UTR</th>
              <th className="py-3 px-4">Settled / Credited</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4">Status & Exception</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRecords.map((record) => {
              const { payment, matchedSettlement, matchedBankTransaction } = record;

              return (
                <tr
                  key={record.recordId}
                  onClick={() => onSelectRecord(record)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  {/* Payment ID & Order */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {payment.paymentId}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {payment.orderId} | {payment.createdAt.slice(0, 10)}
                    </div>
                  </td>

                  {/* Gross / Expected Net */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      {formatINR(payment.grossAmount)}
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium">
                      Net: {formatINR(payment.expectedNetAmount)}
                    </div>
                  </td>

                  {/* Settlement Ref & UTR */}
                  <td className="py-3 px-4">
                    {matchedSettlement ? (
                      <div>
                        <div className="font-mono text-[11px] font-semibold text-slate-800 truncate max-w-[150px]">
                          {matchedSettlement.paymentReference}
                        </div>
                        <div className="font-mono text-[10px] text-indigo-700">
                          {matchedSettlement.utr}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">No Settlement Record</span>
                    )}
                  </td>

                  {/* Settled / Credited */}
                  <td className="py-3 px-4">
                    {matchedSettlement ? (
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatINR(matchedSettlement.settledAmount)}
                        </div>
                        {matchedBankTransaction ? (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Bank: {formatINR(matchedBankTransaction.creditAmount)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-600 font-medium">
                            No Bank Deposit
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">—</span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4 text-center">
                    {getConfidenceBadge(record.confidence)}
                  </td>

                  {/* Status & Exception */}
                  <td className="py-3 px-4">
                    <div className="mb-0.5">{getStatusBadge(record.status)}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {record.exceptionType}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {record.status === 'PENDING_REVIEW' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onQuickApprove(record.recordId)}
                          className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Quick Approve"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onQuickReject(record.recordId)}
                          className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Quick Reject"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        Inspect <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
        </span>
        <span className="text-[11px]">Click any row to open full 3-way trace & AI diagnosis drawer</span>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ExternalLink,
  Download,
  X,
  LayoutList,
  TableProperties,
} from 'lucide-react';
import { ReconciliationRecord, MatchStatus } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

import { useReconciliationFilter } from '@/hooks/useReconciliationFilter';

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
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    exceptionFilter,
    setExceptionFilter,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    filteredRecords,
    exceptionCategories,
    hasActiveFilters,
    clearFilters,
    handleExportFiltered,
  } = useReconciliationFilter(records);

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'AUTO_RECONCILED':
      case 'MANUALLY_APPROVED':
        return (
          <span className="status-badge bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
            <CheckCircle2 className="w-3 h-3 text-[#2dd4bf]" />
            {status === 'AUTO_RECONCILED' ? 'Auto-Reconciled' : 'Approved'}
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="status-badge bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30">
            <Clock className="w-3 h-3 text-[#fbbf24]" />
            Review Needed
          </span>
        );
      case 'UNMATCHED_EXCEPTION':
      case 'MANUALLY_REJECTED':
        return (
          <span className="status-badge bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30">
            <AlertCircle className="w-3 h-3 text-[#f87171]" />
            {status === 'UNMATCHED_EXCEPTION' ? 'Exception' : 'Rejected'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Multi-Facet Filter Toolbar */}
      <div className="elevated-card p-4 space-y-3 bg-[#0e131f] border-white/8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Payment ID, Order Ref, Gateway UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]/50 transition-colors"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | MatchStatus)}
              className="px-3 py-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#94a3b8] font-medium cursor-pointer hover:bg-white/5 transition-colors focus:outline-hidden"
              aria-label="Filter by Match Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="AUTO_RECONCILED">Auto-Reconciled</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="MANUALLY_APPROVED">Manually Approved</option>
              <option value="UNMATCHED_EXCEPTION">Unmatched Exceptions</option>
              <option value="MANUALLY_REJECTED">Rejected</option>
            </select>

            {/* Exception Category Select */}
            <select
              value={exceptionFilter}
              onChange={(e) => setExceptionFilter(e.target.value)}
              className="px-3 py-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#94a3b8] font-medium cursor-pointer max-w-[180px] truncate hover:bg-white/5 transition-colors focus:outline-hidden"
              aria-label="Filter by Anomaly Type"
            >
              <option value="ALL">All Anomaly Types</option>
              {exceptionCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center border border-white/8 rounded-xl p-0.5 bg-[#080c14]">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-[#6366f1]/20 text-[#818cf8] shadow-xs font-semibold'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
                title="Table Grid View"
                aria-label="Table Grid View"
              >
                <TableProperties className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-[#6366f1]/20 text-[#818cf8] shadow-xs font-semibold'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
                title="Card List View"
                aria-label="Card List View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Current View */}
            <button
              onClick={handleExportFiltered}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white rounded-xl text-xs font-semibold border border-white/8 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#64748b]" />
              <span>Export ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2 pt-2.5 border-t border-white/8 text-xs font-sans">
            <span className="text-[11px] text-[#64748b] font-semibold font-mono">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-[#6366f1]/15 text-[#a5b4fc] px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-[#6366f1]/30">
                Search: &quot;{searchQuery}&quot;
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-[#6366f1]/15 text-[#a5b4fc] px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-[#6366f1]/30">
                Status: {statusFilter.replace(/_/g, ' ')}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setStatusFilter('ALL')} />
              </span>
            )}
            {exceptionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-[#6366f1]/15 text-[#a5b4fc] px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-[#6366f1]/30">
                Category: {exceptionFilter.replace(/_/g, ' ')}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setExceptionFilter('ALL')} />
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-[11px] text-[#64748b] hover:text-[#f8fafc] font-semibold underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table View */}
      {viewMode === 'TABLE' ? (
        <div className="elevated-card overflow-hidden bg-[#0e131f] border-white/8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left divide-y divide-white/8">
              <thead className="bg-[#080c14] text-[#64748b] font-semibold uppercase text-[10px] sticky top-0 z-10 font-mono">
                <tr>
                  <th className="py-3 px-3.5">Payment ID</th>
                  <th className="py-3 px-3.5">Order Ref</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
                    onClick={() => {
                      setSortBy('AMOUNT');
                      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Gross Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-right">Expected Net</th>
                  <th className="py-3 px-3.5">Settlement Match</th>
                  <th className="py-3 px-3.5">Bank Credit UTR</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-white text-center"
                    onClick={() => {
                      setSortBy('CONFIDENCE');
                      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Match Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#64748b] font-sans">
                      No reconciliation records match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const isPending = record.status === 'PENDING_REVIEW';

                    return (
                      <tr
                        key={record.recordId}
                        onClick={() => onSelectRecord(record)}
                        className="hover:bg-white/4 transition-colors cursor-pointer group"
                      >
                        {/* Payment ID */}
                        <td className="py-3 px-3.5 font-semibold text-[#f8fafc] group-hover:text-[#818cf8]">
                          {record.payment.paymentId}
                        </td>

                        {/* Order ID */}
                        <td className="py-3 px-3.5 text-[#94a3b8]">
                          {record.payment.orderId}
                        </td>

                        {/* Gross Amount */}
                        <td className="py-3 px-3.5 text-right font-semibold text-[#f8fafc] tabular-nums">
                          {formatINR(record.payment.grossAmount)}
                        </td>

                        {/* Expected Net Amount */}
                        <td className="py-3 px-3.5 text-right text-[#94a3b8] tabular-nums">
                          {formatINR(record.payment.expectedNetAmount)}
                        </td>

                        {/* Settlement Match */}
                        <td className="py-3 px-3.5 font-sans">
                          {record.matchedSettlement ? (
                            <span className="text-[#2dd4bf] flex items-center gap-1 font-mono text-[11px]">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              {record.matchedSettlement.settlementId}
                            </span>
                          ) : (
                            <span className="text-[#f87171] text-[11px] font-mono">Missing Settlement</span>
                          )}
                        </td>

                        {/* Bank Credit UTR */}
                        <td className="py-3 px-3.5 font-sans">
                          {record.matchedBankTransaction ? (
                            <span className="text-[#94a3b8] font-mono text-[11px] truncate max-w-[130px] inline-block" title={record.matchedBankTransaction.utr}>
                              {record.matchedBankTransaction.utr}
                            </span>
                          ) : (
                            <span className="text-[#f87171] text-[11px] font-mono">Missing Credit</span>
                          )}
                        </td>

                        {/* Confidence Score */}
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                              record.confidence >= 85
                                ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30'
                                : record.confidence >= 50
                                ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                                : 'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30'
                            }`}
                          >
                            {record.confidence}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 font-sans">
                          {getStatusBadge(record.status)}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3.5 text-right font-sans space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isPending && (
                            <>
                              <button
                                onClick={() => onQuickApprove(record.recordId)}
                                className="px-2 py-1 rounded-md bg-[#2dd4bf]/15 hover:bg-[#2dd4bf]/25 text-[#2dd4bf] border border-[#2dd4bf]/30 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Approve match"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onQuickReject(record.recordId)}
                                className="px-2 py-1 rounded-md bg-[#f87171]/15 hover:bg-[#f87171]/25 text-[#f87171] border border-[#f87171]/30 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Reject match"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onSelectRecord(record)}
                            className="p-1 rounded-md text-[#64748b] hover:text-[#f8fafc] hover:bg-white/10 transition-colors cursor-pointer"
                            title="Inspect 3-way trace"
                            aria-label={`Inspect evidence for ${record.payment.paymentId}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
          {filteredRecords.map((record) => (
            <div
              key={record.recordId}
              onClick={() => onSelectRecord(record)}
              className="elevated-card-interactive p-4 space-y-3 bg-[#0e131f] border-white/8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#f8fafc] font-mono text-sm">
                    {record.payment.paymentId}
                  </div>
                  <div className="text-[11px] text-[#64748b] font-mono">
                    {record.payment.orderId}
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/8 font-mono">
                <div>
                  <span className="text-[#64748b] block text-[10px]">GROSS AMOUNT</span>
                  <strong className="text-[#f8fafc]">{formatINR(record.payment.grossAmount)}</strong>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">EXPECTED NET</span>
                  <strong className="text-[#94a3b8]">{formatINR(record.payment.expectedNetAmount)}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748b]">Score:</span>
                  <span className="font-bold text-[#f8fafc] font-mono">{record.confidence}%</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecord(record);
                  }}
                  className="text-xs font-semibold text-[#818cf8] hover:text-[#a5b4fc] flex items-center gap-1 cursor-pointer"
                >
                  Inspect Trace <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

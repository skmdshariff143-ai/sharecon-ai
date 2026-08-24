import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ExternalLink,
  Ban,
  Download,
  X,
  LayoutList,
  TableProperties,
} from 'lucide-react';
import { ReconciliationRecord, MatchStatus } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';
import { exportReconciliationCsv } from '@/lib/dataset/csv';

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
  const [exceptionFilter, setExceptionFilter] = useState<string>('ALL');
  const [minConfidence] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'DATE' | 'AMOUNT' | 'CONFIDENCE'>('DATE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Extract unique exception categories
  const exceptionCategories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.exceptionType));
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
        if (exceptionFilter !== 'ALL' && r.exceptionType !== exceptionFilter) return false;
        if (r.confidence < minConfidence) return false;
        if (!searchQuery) return true;

        const q = searchQuery.toLowerCase();
        return (
          r.payment.paymentId.toLowerCase().includes(q) ||
          r.payment.orderId.toLowerCase().includes(q) ||
          (r.matchedSettlement?.utr && r.matchedSettlement.utr.toLowerCase().includes(q)) ||
          (r.matchedSettlement?.settlementId && r.matchedSettlement.settlementId.toLowerCase().includes(q)) ||
          (r.matchedBankTransaction?.bankTransactionId && r.matchedBankTransaction.bankTransactionId.toLowerCase().includes(q)) ||
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
  }, [records, searchQuery, statusFilter, exceptionFilter, minConfidence, sortBy, sortOrder]);

  const handleExportFiltered = () => {
    const csv = exportReconciliationCsv(filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_filtered_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setExceptionFilter('ALL');
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'ALL' || exceptionFilter !== 'ALL' || minConfidence > 0;

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'AUTO_RECONCILED':
      case 'MANUALLY_APPROVED':
        return (
          <span className="status-badge bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status === 'AUTO_RECONCILED' ? 'Auto-Reconciled' : 'Approved'}
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="status-badge bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Review Needed
          </span>
        );
      case 'UNMATCHED_EXCEPTION':
      case 'MANUALLY_REJECTED':
        return (
          <span className="status-badge bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            {status === 'UNMATCHED_EXCEPTION' ? 'Exception' : 'Rejected'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Multi-Facet Filter Toolbar */}
      <div className="surface-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Payment ID, Order Ref, Gateway UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | MatchStatus)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-100 transition-colors"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-pointer max-w-[180px] truncate hover:bg-slate-100 transition-colors"
            >
              <option value="ALL">All Anomaly Types</option>
              {exceptionCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Table Grid View"
              >
                <TableProperties className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Card List View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Current View */}
            <button
              onClick={handleExportFiltered}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold font-mono">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-indigo-200">
                Search: &quot;{searchQuery}&quot;
                <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-indigo-200">
                Status: {statusFilter.replace(/_/g, ' ')}
                <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => setStatusFilter('ALL')} />
              </span>
            )}
            {exceptionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-indigo-200">
                Category: {exceptionFilter.replace(/_/g, ' ')}
                <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => setExceptionFilter('ALL')} />
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer ml-auto"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table View */}
      {viewMode === 'TABLE' ? (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] sticky top-0 z-10 font-mono">
                <tr>
                  <th className="py-3 px-3.5">Payment ID</th>
                  <th className="py-3 px-3.5">Order Ref</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 text-right"
                    onClick={() => {
                      setSortBy('AMOUNT');
                      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Gross Amt</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Settlement ID</th>
                  <th className="py-3 px-3.5">Bank UTR</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 text-center"
                    onClick={() => {
                      setSortBy('CONFIDENCE');
                      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Anomaly Category</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                      No reconciliation records match the active search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.recordId}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => onSelectRecord(record)}
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {record.payment.paymentId}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{record.payment.orderId}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 text-right tabular-nums">
                        {formatINR(record.payment.grossAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {record.matchedSettlement ? (
                          record.matchedSettlement.settlementId
                        ) : (
                          <span className="text-rose-500 font-sans text-[11px] font-semibold">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {record.matchedSettlement?.utr ||
                          record.matchedBankTransaction?.utr || (
                            <span className="text-slate-400 font-sans text-[11px]">—</span>
                          )}
                      </td>
                      <td className="py-3 px-3.5 font-sans">{getStatusBadge(record.status)}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`font-bold tabular-nums ${
                            record.confidence >= 85
                              ? 'text-emerald-700'
                              : record.confidence >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {record.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-sans">
                        <span className="text-[11px] text-slate-600 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                          {record.exceptionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3.5 text-right font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {record.status === 'PENDING_REVIEW' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onQuickApprove(record.recordId)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 cursor-pointer transition-colors"
                              title="Quick Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onQuickReject(record.recordId)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                              title="Quick Reject"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectRecord(record)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            Trace <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile / Card List View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredRecords.map((record) => (
            <div
              key={record.recordId}
              onClick={() => onSelectRecord(record)}
              className="surface-card-interactive p-4 space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {record.payment.paymentId}
                </span>
                {getStatusBadge(record.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Gross</span>
                  <strong className="metric-value">{formatINR(record.payment.grossAmount)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Confidence</span>
                  <strong className="text-indigo-700 font-bold tabular-nums">{record.confidence}%</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono">
                <div>Order: {record.payment.orderId}</div>
                <div>UTR: {record.matchedSettlement?.utr || '—'}</div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {record.exceptionType.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                  Inspect 3-Way <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

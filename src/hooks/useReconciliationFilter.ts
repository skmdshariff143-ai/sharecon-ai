import { useState, useMemo } from 'react';
import { ReconciliationRecord, MatchStatus } from '@/types/reconciliation';
import { exportReconciliationCsv } from '@/lib/dataset/csv';

export type SortByField = 'DATE' | 'AMOUNT' | 'CONFIDENCE';
export type SortOrder = 'ASC' | 'DESC';
export type ViewMode = 'TABLE' | 'CARDS';

export interface UseReconciliationFilterOptions {
  initialStatus?: 'ALL' | MatchStatus;
  initialSortBy?: SortByField;
  initialSortOrder?: SortOrder;
}

export interface ReconciliationFilterState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'ALL' | MatchStatus;
  setStatusFilter: (status: 'ALL' | MatchStatus) => void;
  exceptionFilter: string;
  setExceptionFilter: (type: string) => void;
  minConfidence: number;
  setMinConfidence: (val: number) => void;
  sortBy: SortByField;
  setSortBy: (field: SortByField) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filteredRecords: ReconciliationRecord[];
  exceptionCategories: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  handleExportFiltered: () => void;
}

export function useReconciliationFilter(
  records: ReconciliationRecord[],
  options: UseReconciliationFilterOptions = {}
): ReconciliationFilterState {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>(
    options.initialStatus || 'ALL'
  );
  const [exceptionFilter, setExceptionFilter] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortByField>(options.initialSortBy || 'DATE');
  const [sortOrder, setSortOrder] = useState<SortOrder>(options.initialSortOrder || 'DESC');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

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
          (r.matchedSettlement?.settlementId &&
            r.matchedSettlement.settlementId.toLowerCase().includes(q)) ||
          (r.matchedBankTransaction?.bankTransactionId &&
            r.matchedBankTransaction.bankTransactionId.toLowerCase().includes(q)) ||
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
    setMinConfidence(0);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'ALL' ||
      exceptionFilter !== 'ALL' ||
      minConfidence > 0
  );

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    exceptionFilter,
    setExceptionFilter,
    minConfidence,
    setMinConfidence,
    sortBy,
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
  };
}

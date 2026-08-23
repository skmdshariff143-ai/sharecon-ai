/**
 * Collision and Duplicate Prevention Engine for ShaRecon AI
 * Enforces 1-to-1 matching constraints and detects duplicate credits or settlements.
 */

import { Settlement, BankTransaction } from '@/types/reconciliation';
import { normalizeReference, normalizeUtr } from './normalizer';

export interface CollisionAnalysis {
  duplicateSettlementIds: Set<string>;
  duplicateBankTxIds: Set<string>;
  settlementRefToCount: Map<string, number>;
  bankUtrToCount: Map<string, number>;
}

export function detectDatasetCollisions(
  settlements: Settlement[],
  bankTransactions: BankTransaction[]
): CollisionAnalysis {
  const duplicateSettlementIds = new Set<string>();
  const duplicateBankTxIds = new Set<string>();

  const settlementRefToCount = new Map<string, number>();
  const settlementRefToIds = new Map<string, string[]>();

  settlements.forEach((s) => {
    const normRef = normalizeReference(s.paymentReference);
    if (!normRef) return;
    const count = (settlementRefToCount.get(normRef) || 0) + 1;
    settlementRefToCount.set(normRef, count);

    const ids = settlementRefToIds.get(normRef) || [];
    ids.push(s.settlementId);
    settlementRefToIds.set(normRef, ids);
  });

  settlementRefToIds.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => duplicateSettlementIds.add(id));
    }
  });

  const bankUtrToCount = new Map<string, number>();
  const bankUtrToIds = new Map<string, string[]>();

  bankTransactions.forEach((b) => {
    const normUtr = normalizeUtr(b.utr);
    if (!normUtr) return;
    const count = (bankUtrToCount.get(normUtr) || 0) + 1;
    bankUtrToCount.set(normUtr, count);

    const ids = bankUtrToIds.get(normUtr) || [];
    ids.push(b.bankTransactionId);
    bankUtrToIds.set(normUtr, ids);
  });

  bankUtrToIds.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => duplicateBankTxIds.add(id));
    }
  });

  return {
    duplicateSettlementIds,
    duplicateBankTxIds,
    settlementRefToCount,
    bankUtrToCount,
  };
}

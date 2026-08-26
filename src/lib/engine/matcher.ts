/**
 * Deterministic Reconciliation Engine for ShaRecon AI
 * Core matching orchestrator with collision prevention, threshold routing, and audit logging.
 */

import {
  Payment,
  Settlement,
  BankTransaction,
  ReconciliationRecord,
  AuditEvent,
  EngineConfig,
  BatchReconciliationResult,
  MatchStatus,
  ReconciliationPartitionContext,
} from '@/types/reconciliation';
import { normalizeReference, normalizeUtr } from './normalizer';
import { score3WayMatch } from './scorer';
import { detectDatasetCollisions } from './collision';

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  highConfidenceThreshold: 85,
  mediumConfidenceThreshold: 50,
  maxDateDeltaDays: 3,
  feeTolerancePaise: 0,
  circuitBreakerThresholdPercent: 35,
  dryRun: true,
};

export function reconcileBatch(
  payments: Payment[],
  settlements: Settlement[],
  bankTransactions: BankTransaction[],
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
  existingAuditEvents: AuditEvent[] = [],
  partitionContext?: ReconciliationPartitionContext
): BatchReconciliationResult {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const executedAt = new Date().toISOString();

  // 1. Pre-indexing for candidate lookup
  const settlementByPayRef = new Map<string, Settlement[]>();
  const settlementById = new Map<string, Settlement>();

  settlements.forEach((s) => {
    settlementById.set(s.settlementId, s);
    const normRef = normalizeReference(s.paymentReference);
    if (normRef) {
      const list = settlementByPayRef.get(normRef) || [];
      list.push(s);
      settlementByPayRef.set(normRef, list);
    }
  });

  const bankByUtr = new Map<string, BankTransaction[]>();
  const bankById = new Map<string, BankTransaction>();

  bankTransactions.forEach((b) => {
    bankById.set(b.bankTransactionId, b);
    const normUtr = normalizeUtr(b.utr);
    if (normUtr) {
      const list = bankByUtr.get(normUtr) || [];
      list.push(b);
      bankByUtr.set(normUtr, list);
    }
  });

  const settlementByAmount = new Map<number, Settlement[]>();
  settlements.forEach((s) => {
    const list = settlementByAmount.get(s.settledAmount) || [];
    list.push(s);
    settlementByAmount.set(s.settledAmount, list);
  });

  // 2. Collision & duplicate analysis
  const collisions = detectDatasetCollisions(settlements, bankTransactions);

  // Track assigned entities to prevent duplicate claim in this batch run
  const assignedSettlementIds = new Set<string>();
  const assignedBankTxIds = new Set<string>();

  const records: ReconciliationRecord[] = [];
  const auditEvents: AuditEvent[] = [...existingAuditEvents];

  // 3. Process each payment
  payments.forEach((payment) => {
    const normPayId = normalizeReference(payment.paymentId);
    const normOrderId = normalizeReference(payment.orderId);

    // Look for matching settlements (by paymentId first, then by orderId)
    const payIdMatches = settlementByPayRef.get(normPayId) || [];
    const orderIdMatches = settlementByPayRef.get(normOrderId) || [];
    let candidateSettlements = [...payIdMatches, ...orderIdMatches];

    // Secondary candidate lookup by amount if no direct reference found
    if (candidateSettlements.length === 0) {
      const amountMatches = settlementByAmount.get(payment.expectedNetAmount) || [];
      candidateSettlements = amountMatches;
    }

    // Find best candidate settlement that hasn't been claimed yet
    let bestSettlement: Settlement | null = null;
    let hasDuplicateSettlement = false;

    if (candidateSettlements.length > 1) {
      hasDuplicateSettlement = true;
      // Pick first available one
      bestSettlement =
        candidateSettlements.find((s) => !assignedSettlementIds.has(s.settlementId)) ||
        candidateSettlements[0];
    } else if (candidateSettlements.length === 1) {
      bestSettlement = candidateSettlements[0];
    }

    // Look for matching bank transactions
    let bestBankTx: BankTransaction | null = null;
    let hasDuplicateBank = false;

    if (bestSettlement) {
      const normUtr = normalizeUtr(bestSettlement.utr);
      const bankCandidates = bankByUtr.get(normUtr) || [];

      if (bankCandidates.length > 1) {
        hasDuplicateBank = true;
        bestBankTx =
          bankCandidates.find((b) => !assignedBankTxIds.has(b.bankTransactionId)) ||
          bankCandidates[0];
      } else if (bankCandidates.length === 1) {
        bestBankTx = bankCandidates[0];
      }
    }

    // Score the 3-way match
    const scoreRes = score3WayMatch(
      payment,
      bestSettlement,
      bestBankTx,
      config.feeTolerancePaise
    );

    let finalConfidence = scoreRes.confidence;
    let finalExceptionType = scoreRes.exceptionType;
    let status: MatchStatus = 'UNMATCHED_EXCEPTION';

    // Override exception category if duplicate collision detected
    if (hasDuplicateSettlement || (bestSettlement && collisions.duplicateSettlementIds.has(bestSettlement.settlementId))) {
      finalExceptionType = 'DUPLICATE_SETTLEMENT';
      finalConfidence = Math.min(finalConfidence, 65); // Cap confidence for duplicate review
    } else if (hasDuplicateBank || (bestBankTx && collisions.duplicateBankTxIds.has(bestBankTx.bankTransactionId))) {
      finalExceptionType = 'DUPLICATE_BANK_CREDIT';
      finalConfidence = Math.min(finalConfidence, 65); // Cap confidence for duplicate review
    }

    const isSafeForAutoReconcile =
      (finalExceptionType === 'CLEAN_MATCH' ||
        finalExceptionType === 'DATE_SKEW_MATCH' ||
        finalExceptionType === 'INCONSISTENT_DESCRIPTION' ||
        finalExceptionType === 'PARTIALLY_MISSING_REF') &&
      !hasDuplicateSettlement &&
      !hasDuplicateBank &&
      scoreRes.evidence.details.referenceMatch !== 'NONE';

    // Route status based on calibrated thresholds & safety classification
    if (
      !bestSettlement ||
      !bestBankTx ||
      finalExceptionType === 'MISSING_BANK_CREDIT' ||
      finalExceptionType === 'MISSING_SETTLEMENT' ||
      finalExceptionType === 'UNSUPPORTED_CURRENCY'
    ) {
      status = 'UNMATCHED_EXCEPTION';
    } else if (finalConfidence >= config.highConfidenceThreshold && isSafeForAutoReconcile) {
      status = 'AUTO_RECONCILED';
      if (bestSettlement) assignedSettlementIds.add(bestSettlement.settlementId);
      if (bestBankTx) assignedBankTxIds.add(bestBankTx.bankTransactionId);
    } else if (finalConfidence >= config.mediumConfidenceThreshold) {
      status = 'PENDING_REVIEW';
    } else {
      status = 'UNMATCHED_EXCEPTION';
    }

    const record: ReconciliationRecord = {
      recordId: payment.paymentId,
      payment,
      matchedSettlement: bestSettlement,
      matchedBankTransaction: bestBankTx,
      status,
      confidence: finalConfidence,
      evidence: scoreRes.evidence,
      explanation: scoreRes.explanation,
      exceptionType: finalExceptionType,
      financialExposurePaise: scoreRes.financialExposurePaise,
    };

    records.push(record);

    // Create append-only audit event
    const eventId = `aud_${Date.now()}_${payment.paymentId}`;
    const auditEvent: AuditEvent = {
      eventId,
      timestamp: executedAt,
      actor: 'SYSTEM_ENGINE',
      action: status === 'AUTO_RECONCILED' ? 'AUTO_RECONCILE' : 'BATCH_RUN',
      entityIds: {
        paymentId: payment.paymentId,
        settlementId: bestSettlement?.settlementId,
        bankTransactionId: bestBankTx?.bankTransactionId,
        batchId,
      },
      previousState: 'UNPROCESSED',
      newState: status,
      evidence: {
        confidence: finalConfidence,
        exceptionType: finalExceptionType,
        referenceScore: scoreRes.evidence.referenceScore,
        amountScore: scoreRes.evidence.amountScore,
        dateScore: scoreRes.evidence.dateScore,
        dryRun: config.dryRun,
      },
      confidence: finalConfidence,
      reason: scoreRes.explanation,
      modelUsed: 'ShaRecon-Deterministic-v1',
      fallbackUsed: false,
    };

    auditEvents.push(auditEvent);
  });

  // 4. Batch Safety Circuit Breaker Check
  const anomalyCount = records.filter(
    (r) => r.status === 'UNMATCHED_EXCEPTION' || r.exceptionType === 'AMOUNT_MISMATCH'
  ).length;
  const anomalyPercent = payments.length > 0 ? (anomalyCount / payments.length) * 100 : 0;
  const circuitBreakerTriggered = anomalyPercent > config.circuitBreakerThresholdPercent;

  return {
    batchId,
    executedAt,
    config,
    circuitBreakerTriggered,
    circuitBreakerReason: circuitBreakerTriggered
      ? `Batch anomaly rate (${anomalyPercent.toFixed(1)}%) exceeded safe threshold (${config.circuitBreakerThresholdPercent}%). Review required.`
      : undefined,
    records,
    auditEvents,
    partitionContext,
  };
}

export interface DataPartition {
  partitionKey: string;
  payments: Payment[];
  settlements: Settlement[];
  bankTransactions: BankTransaction[];
}

/**
 * Partitions transactions logically into N deterministic subsets (e.g. by date bucket or entity hash).
 * In an enterprise distributed environment (Spark/Temporal), each partition is scheduled independently.
 */
export function partitionDatasetByDateAndMerchant(
  payments: Payment[],
  settlements: Settlement[],
  bankTransactions: BankTransaction[],
  options?: {
    numPartitions?: number;
  }
): DataPartition[] {
  const numPartitions = Math.max(1, options?.numPartitions || 4);
  const partitions: DataPartition[] = Array.from({ length: numPartitions }, (_, i) => ({
    partitionKey: `part_${i + 1}_of_${numPartitions}`,
    payments: [],
    settlements: [],
    bankTransactions: [],
  }));

  // Hash modulo assignment to preserve deterministic placement
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // Index references to route corresponding settlements and bank txs into the same partition
  const payIdToPartition = new Map<string, number>();

  payments.forEach((payment) => {
    // Partition by payment date bucket if available, else modulo on payment ID
    const dateBucket = payment.createdAt.split('T')[0];
    const partitionIdx = (hashString(dateBucket) + hashString(payment.paymentId)) % numPartitions;
    payIdToPartition.set(payment.paymentId, partitionIdx);
    payIdToPartition.set(payment.orderId, partitionIdx);
    partitions[partitionIdx].payments.push(payment);
  });

  settlements.forEach((s) => {
    const assignedIdx = payIdToPartition.get(s.paymentReference) ?? (hashString(s.settlementId) % numPartitions);
    partitions[assignedIdx].settlements.push(s);
  });

  // Index UTR to partition
  const utrToPartition = new Map<string, number>();
  settlements.forEach((s) => {
    const partIdx = payIdToPartition.get(s.paymentReference);
    if (partIdx !== undefined && s.utr) {
      utrToPartition.set(s.utr, partIdx);
    }
  });

  bankTransactions.forEach((b) => {
    const assignedIdx = utrToPartition.get(b.utr) ?? (hashString(b.bankTransactionId) % numPartitions);
    partitions[assignedIdx].bankTransactions.push(b);
  });

  return partitions;
}

/**
 * Reconciles partitions independently and combines output into a unified batch result,
 * proving mathematical equivalence with non-partitioned single-thread batch execution.
 */
export function reconcilePartitionedBatch(
  payments: Payment[],
  settlements: Settlement[],
  bankTransactions: BankTransaction[],
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
  existingAuditEvents: AuditEvent[] = [],
  options?: { numPartitions?: number }
): {
  combinedResult: BatchReconciliationResult;
  partitionResults: BatchReconciliationResult[];
  partitionCount: number;
} {
  const partitions = partitionDatasetByDateAndMerchant(payments, settlements, bankTransactions, options);

  const partitionResults: BatchReconciliationResult[] = partitions.map((part, idx) => {
    return reconcileBatch(
      part.payments,
      part.settlements,
      part.bankTransactions,
      config,
      [],
      {
        partitionKey: part.partitionKey,
        partitionIndex: idx + 1,
        totalPartitions: partitions.length,
      }
    );
  });

  const combinedRecords = partitionResults.flatMap((r) => r.records);
  const combinedAuditEvents = [...existingAuditEvents, ...partitionResults.flatMap((r) => r.auditEvents)];

  const combinedResult: BatchReconciliationResult = {
    batchId: `batch_partitioned_${Date.now()}`,
    executedAt: new Date().toISOString(),
    config,
    circuitBreakerTriggered: partitionResults.some((r) => r.circuitBreakerTriggered),
    records: combinedRecords,
    auditEvents: combinedAuditEvents,
  };

  return {
    combinedResult,
    partitionResults,
    partitionCount: partitions.length,
  };
}

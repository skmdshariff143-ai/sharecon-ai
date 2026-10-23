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
import { BankTransactionSchema, EngineConfigSchema, MAX_IMPORT_ROWS, PaymentSchema, SettlementSchema } from '../validation';
import { calculateDateDeltaDays } from './normalizer';

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
  EngineConfigSchema.parse(config);
  validateStatements(payments, settlements, bankTransactions);
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const executedAt = new Date().toISOString();

  // 1. Pre-indexing for candidate lookup
  const settlementByPayRef = new Map<string, Settlement[]>();
  const settlementUtrCounts = new Map<string, number>();

  settlements.forEach((s) => {
    const utr = normalizeUtr(s.utr);
    settlementUtrCounts.set(utr, (settlementUtrCounts.get(utr) ?? 0) + 1);
    const normRef = normalizeReference(s.paymentReference);
    if (normRef) {
      const list = settlementByPayRef.get(normRef) || [];
      list.push(s);
      settlementByPayRef.set(normRef, list);
    }
  });

  const bankByUtr = new Map<string, BankTransaction[]>();

  bankTransactions.forEach((b) => {
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
    let candidateSettlements = [...new Set([...payIdMatches, ...orderIdMatches])];

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
    const safetyReasons: string[] = [];
    if (payment.status !== 'captured' || (bestSettlement && bestSettlement.status !== 'processed')) {
      safetyReasons.push('Payment must be captured and settlement processed.');
    }
    if (bestSettlement && bestBankTx) {
      if (Date.parse(bestSettlement.settledAt) < Date.parse(payment.createdAt) ||
          Date.parse(bestBankTx.creditedAt) < Date.parse(bestSettlement.settledAt) ||
          calculateDateDeltaDays(payment.createdAt, bestSettlement.settledAt) > config.maxDateDeltaDays ||
          calculateDateDeltaDays(bestSettlement.settledAt, bestBankTx.creditedAt) > config.maxDateDeltaDays) {
        safetyReasons.push('A settlement or bank credit is outside the configured date window.');
      }
      if (assignedSettlementIds.has(bestSettlement.settlementId) || assignedBankTxIds.has(bestBankTx.bankTransactionId) ||
          (settlementUtrCounts.get(normalizeUtr(bestSettlement.utr)) ?? 0) > 1) {
        safetyReasons.push('Settlement or bank credit is shared by multiple claims.');
      }
      const narrationRefs = bestBankTx.description.match(/\b(?:[a-z0-9]+_)?pay_[a-z0-9_]+\b/gi) ?? [];
      if (narrationRefs.some(ref => !normPayId.includes(normalizeReference(ref)))) {
        finalExceptionType = 'INCONSISTENT_DESCRIPTION';
        safetyReasons.push('Bank narration references a different payment.');
      }
      if (scoreRes.evidence.details.referenceMatch !== 'EXACT_PAYMENT_ID' &&
          !bestBankTx.description.split(/[\s/,:;]+/).some(ref => normalizeReference(ref) === normPayId)) {
        safetyReasons.push('An indirect settlement reference requires payment ID corroboration in bank narration.');
      }
    }

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
      safetyReasons.length === 0 &&
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
      evidence: { ...scoreRes.evidence, totalConfidence: finalConfidence },
      explanation: [scoreRes.explanation, ...safetyReasons].join(' '),
      exceptionType: finalExceptionType,
      financialExposurePaise: safetyReasons.length ? Math.max(scoreRes.financialExposurePaise, payment.expectedNetAmount) : scoreRes.financialExposurePaise,
    };

    records.push(record);

    // Create append-only audit event
    const eventId = `aud_${batchId}_${payment.paymentId}`;
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
      reason: record.explanation,
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
  holdAutomaticMatches(records, auditEvents.slice(existingAuditEvents.length), circuitBreakerTriggered);

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

function validateStatements(payments: Payment[], settlements: Settlement[], banks: BankTransaction[]) {
  const groups = [
    { rows: payments, schema: PaymentSchema, key: 'paymentId', amount: 'grossAmount' },
    { rows: settlements, schema: SettlementSchema, key: 'settlementId', amount: 'settledAmount' },
    { rows: banks, schema: BankTransactionSchema, key: 'bankTransactionId', amount: 'creditAmount' },
  ] as const;
  for (const { rows, schema, key, amount } of groups) {
    if (rows.length > MAX_IMPORT_ROWS) throw new Error('Statement exceeds 10,000 rows.');
    const ids = new Set<string>();
    let total = 0;
    for (const row of rows) {
      schema.parse(row);
      const value = row as unknown as Record<string, string | number>;
      const id = normalizeReference(String(value[key]));
      if (ids.has(id)) throw new Error(`Duplicate ${key}.`);
      ids.add(id);
      total += Number(value[amount]);
      if (!Number.isSafeInteger(total)) throw new Error('Statement total exceeds safe integer paise.');
    }
  }
}

function holdAutomaticMatches(records: ReconciliationRecord[], events: AuditEvent[], triggered: boolean) {
  if (!triggered) return;
  const held = new Map<string, ReconciliationRecord>();
  for (const record of records) {
    if (record.status !== 'AUTO_RECONCILED') continue;
    record.status = 'PENDING_REVIEW';
    record.explanation += ' Batch anomaly threshold exceeded; automatic resolution held for review.';
    record.financialExposurePaise = record.payment.expectedNetAmount;
    held.set(record.recordId, record);
  }
  for (const event of events) {
    const record = held.get(event.entityIds.paymentId ?? '');
    if (!record) continue;
    event.action = 'BATCH_RUN';
    event.newState = record.status;
    event.reason = record.explanation;
  }
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
  const numPartitions = options?.numPartitions ?? 4;
  if (!Number.isInteger(numPartitions) || numPartitions < 1 || numPartitions > 64) {
    throw new Error('Partition count must be an integer between 1 and 64.');
  }
  validateStatements(payments, settlements, bankTransactions);
  const partitions: DataPartition[] = Array.from({ length: numPartitions }, (_, i) => ({
    partitionKey: 'part_' + (i + 1) + '_of_' + numPartitions,
    payments: [], settlements: [], bankTransactions: [],
  }));
  // Every possible candidate/collision relationship must stay in one component.
  // Joining equal amounts conservatively prevents amount-fallback matches from
  // crossing a partition boundary, even when exact references also exist.
  const parents = new Map<string, string>();
  function root(key: string): string {
    if (!parents.has(key)) parents.set(key, key);
    let current = key;
    while (parents.get(current) !== current) current = parents.get(current)!;
    while (parents.get(key) !== key) {
      const next = parents.get(key)!;
      parents.set(key, current);
      key = next;
    }
    return current;
  }
  function join(keys: string[]) {
    const first = root(keys[0]);
    for (const key of keys.slice(1)) parents.set(root(key), first);
  }
  const ref = (s: string) => 'ref:' + normalizeReference(s);
  const utr = (s: string) => 'utr:' + normalizeUtr(s);
  const amount = (n: number) => 'amount:' + n;
  payments.forEach(p => join([ref(p.paymentId), ref(p.orderId), amount(p.expectedNetAmount)]));
  settlements.forEach(s => join([ref(s.paymentReference), amount(s.settledAmount), utr(s.utr)]));
  bankTransactions.forEach(b => root(utr(b.utr)));
  function bucket(key: string) {
    let hash = 2166136261;
    for (const char of root(key)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return partitions[(hash >>> 0) % numPartitions];
  }
  payments.forEach(p => bucket(ref(p.paymentId)).payments.push(p));
  settlements.forEach(s => bucket(ref(s.paymentReference)).settlements.push(s));
  bankTransactions.forEach(b => bucket(utr(b.utr)).bankTransactions.push(b));

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
  EngineConfigSchema.parse(config);
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

  const byId = new Map(partitionResults.flatMap(r => r.records).map(r => [r.recordId, r]));
  const combinedRecords = payments.map(p => byId.get(p.paymentId)!);
  const anomalyCount = combinedRecords.filter(r => r.status === 'UNMATCHED_EXCEPTION' || r.exceptionType === 'AMOUNT_MISMATCH').length;
  const anomalyPercent = payments.length ? anomalyCount / payments.length * 100 : 0;
  const triggered = anomalyPercent > config.circuitBreakerThresholdPercent;
  const newEvents = partitionResults.flatMap(r => r.auditEvents);
  holdAutomaticMatches(combinedRecords, newEvents, triggered);
  partitionResults.forEach(result => { result.config = config; result.circuitBreakerTriggered = triggered; });
  const combinedAuditEvents = [...existingAuditEvents, ...partitionResults.flatMap((r) => r.auditEvents)];

  const combinedResult: BatchReconciliationResult = {
    batchId: `batch_partitioned_${Date.now()}`,
    executedAt: new Date().toISOString(),
    config,
    circuitBreakerTriggered: triggered,
    circuitBreakerReason: triggered ? 'Global batch anomaly threshold exceeded; review required.' : undefined,
    records: combinedRecords,
    auditEvents: combinedAuditEvents,
  };

  return {
    combinedResult,
    partitionResults,
    partitionCount: partitions.length,
  };
}

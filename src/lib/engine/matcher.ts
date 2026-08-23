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
  existingAuditEvents: AuditEvent[] = []
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
  };
}

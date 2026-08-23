/**
 * Operational Controller Decisions & Audit Event Management
 * Pure, testable operational workflow functions for ShaRecon AI.
 */

import {
  ReconciliationRecord,
  AuditEvent,
  OperationalDecisionResult,
} from '@/types/reconciliation';

export function applyReviewerDecision(
  records: readonly ReconciliationRecord[],
  auditEvents: readonly AuditEvent[],
  recordId: string,
  action: 'APPROVED' | 'REJECTED' | 'FLAGGED',
  reviewer = 'Finance Operations Lead',
  note?: string,
  timestamp = new Date().toISOString()
): OperationalDecisionResult {
  const targetRecord = records.find((r) => r.recordId === recordId);
  const previousState = targetRecord?.status || 'PENDING_REVIEW';

  const newStatus =
    action === 'APPROVED'
      ? ('MANUALLY_APPROVED' as const)
      : action === 'REJECTED'
      ? ('MANUALLY_REJECTED' as const)
      : targetRecord?.status || 'PENDING_REVIEW';

  const updatedRecords = records.map((r) => {
    if (r.recordId === recordId) {
      return {
        ...r,
        status: newStatus,
        reviewerDecision: {
          action,
          reviewer,
          reviewedAt: timestamp,
          note: note || `Manual controller decision: ${action}`,
        },
      };
    }
    return r;
  });

  const modifiedRecord = updatedRecords.find((r) => r.recordId === recordId);

  const newEvent: AuditEvent = {
    eventId: `aud_rev_${Date.now()}_${recordId}`,
    timestamp,
    actor: 'FINANCE_REVIEWER',
    action:
      action === 'APPROVED'
        ? 'MANUAL_APPROVE'
        : action === 'REJECTED'
        ? 'MANUAL_REJECT'
        : 'INVESTIGATION_FLAG',
    entityIds: {
      paymentId: recordId,
      settlementId: targetRecord?.matchedSettlement?.settlementId,
      bankTransactionId: targetRecord?.matchedBankTransaction?.bankTransactionId,
    },
    previousState,
    newState: newStatus,
    evidence: {
      note: note || '',
      originalConfidence: targetRecord?.confidence,
      exceptionType: targetRecord?.exceptionType,
    },
    confidence: targetRecord?.confidence || 0,
    reason: note || `Human controller decision: ${action}`,
    modelUsed: 'Human-In-The-Loop',
    fallbackUsed: false,
  };

  const updatedAuditEvents = [newEvent, ...auditEvents];

  return {
    updatedRecords,
    updatedAuditEvents,
    modifiedRecord,
    newEvent,
  };
}

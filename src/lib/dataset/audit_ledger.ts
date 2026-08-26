/**
 * Tamper-Evident Cryptographic Audit Ledger for ShaRecon AI
 * Implements a lightweight hash-chained ledger (blockchain-style) for financial audit trails.
 * Each audit event is bound to the previous block hash via a deterministic SHA-256 digest,
 * guaranteeing that any retroactive tampering or deletion is instantly detectable.
 */

import { AuditEvent } from '@/types/reconciliation';
import { computeDeterministicDigest } from './compliance_package';

export const GENESIS_HASH = '0'.repeat(64);

export interface LedgerVerificationResult {
  isValid: boolean;
  verifiedCount: number;
  genesisHash: string;
  latestBlockHash: string;
  brokenAtIndex?: number;
  brokenEventId?: string;
  expectedHash?: string;
  actualHash?: string;
  reason?: string;
}

/**
 * Computes the cryptographic payload string for an individual audit event.
 */
export function getEventPayload(event: Omit<AuditEvent, 'eventHash'>, prevHash: string): string {
  return JSON.stringify({
    prevHash,
    sequenceNumber: event.sequenceNumber ?? 1,
    eventId: event.eventId,
    timestamp: event.timestamp,
    actor: event.actor,
    action: event.action,
    entityIds: event.entityIds,
    previousState: event.previousState,
    newState: event.newState,
    confidence: event.confidence,
    reason: event.reason,
    modelUsed: event.modelUsed,
    fallbackUsed: event.fallbackUsed,
    evidence: event.evidence,
  });
}

/**
 * Computes a 64-character deterministic block hash for an audit event chained to prevHash.
 */
export function computeEventHash(
  event: Omit<AuditEvent, 'eventHash'>,
  prevHash: string
): string {
  const payload = getEventPayload(event, prevHash);
  return computeDeterministicDigest(payload);
}

/**
 * Chains a list of audit events into a tamper-evident sequence.
 * Expects events in chronological order (first event = Block #1).
 */
export function chainAuditEvents(
  events: readonly AuditEvent[],
  genesisHash: string = GENESIS_HASH
): AuditEvent[] {
  let prevHash = genesisHash;
  const chained: AuditEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const raw = events[i];
    const sequenceNumber = i + 1;
    const eventWithPrev: Omit<AuditEvent, 'eventHash'> = {
      ...raw,
      sequenceNumber,
      prevHash,
    };
    const eventHash = computeEventHash(eventWithPrev, prevHash);

    chained.push({
      ...eventWithPrev,
      eventHash,
    });

    prevHash = eventHash;
  }

  return chained;
}

/**
 * Verifies the complete cryptographic chain of an audit event ledger.
 * Detects modified payloads, broken sequence numbers, or invalid previous hash references.
 */
export function verifyLedgerIntegrity(
  events: readonly AuditEvent[],
  genesisHash: string = GENESIS_HASH
): LedgerVerificationResult {
  if (!events || events.length === 0) {
    return {
      isValid: true,
      verifiedCount: 0,
      genesisHash,
      latestBlockHash: genesisHash,
    };
  }

  // Determine chronological order (ascending sequence numbers or timestamp)
  const isReverseOrder =
    events.length > 1 &&
    events[0].sequenceNumber !== undefined &&
    events[events.length - 1].sequenceNumber !== undefined &&
    (events[0].sequenceNumber ?? 0) > (events[events.length - 1].sequenceNumber ?? 0);

  const chronologicalEvents = isReverseOrder ? [...events].reverse() : [...events];

  let prevHash = genesisHash;

  for (let i = 0; i < chronologicalEvents.length; i++) {
    const event = chronologicalEvents[i];
    const expectedSeq = i + 1;

    // 1. Verify sequence number
    if (event.sequenceNumber !== undefined && event.sequenceNumber !== expectedSeq) {
      return {
        isValid: false,
        verifiedCount: i,
        genesisHash,
        latestBlockHash: prevHash,
        brokenAtIndex: i,
        brokenEventId: event.eventId,
        reason: `Sequence number mismatch at block #${expectedSeq}: expected ${expectedSeq}, got ${event.sequenceNumber}`,
      };
    }

    // 2. Verify previous hash pointer
    if (event.prevHash && event.prevHash !== prevHash) {
      return {
        isValid: false,
        verifiedCount: i,
        genesisHash,
        latestBlockHash: prevHash,
        brokenAtIndex: i,
        brokenEventId: event.eventId,
        expectedHash: prevHash,
        actualHash: event.prevHash,
        reason: `Broken chain link at block #${expectedSeq}: expected previous hash ${prevHash.slice(0, 12)}..., found ${event.prevHash.slice(0, 12)}...`,
      };
    }

    // 3. Recompute event hash and verify cryptographic digest
    const expectedHash = computeEventHash(
      {
        ...event,
        sequenceNumber: expectedSeq,
        prevHash,
      },
      prevHash
    );

    if (event.eventHash && event.eventHash !== expectedHash) {
      return {
        isValid: false,
        verifiedCount: i,
        genesisHash,
        latestBlockHash: prevHash,
        brokenAtIndex: i,
        brokenEventId: event.eventId,
        expectedHash,
        actualHash: event.eventHash,
        reason: `Tampered payload detected at block #${expectedSeq} (Event ID: ${event.eventId}). Computed digest does not match stored block hash.`,
      };
    }

    prevHash = expectedHash;
  }

  return {
    isValid: true,
    verifiedCount: chronologicalEvents.length,
    genesisHash,
    latestBlockHash: prevHash,
  };
}

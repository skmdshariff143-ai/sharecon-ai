/** Session hash chain. Authenticity requires an independently retained chain head. */
import { AuditEvent } from '@/types/reconciliation';
import { canonicalJson, computeDeterministicDigest } from './digest';
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
export function getEventPayload(event: Omit<AuditEvent, 'eventHash'>, prevHash: string): string {
  return canonicalJson({ ...event, eventHash: undefined, prevHash, sequenceNumber: event.sequenceNumber ?? 1 });
}
export async function computeEventHash(event: Omit<AuditEvent, 'eventHash'>, prevHash: string): Promise<string> {
  return computeDeterministicDigest(getEventPayload(event, prevHash));
}
/** Create an initial chain in chronological order; validate already hashed entries, never repair them. */
export async function chainAuditEvents(events: readonly AuditEvent[], genesisHash = GENESIS_HASH): Promise<AuditEvent[]> {
  let prevHash = genesisHash;
  const result: AuditEvent[] = [];
  const ids = new Set<string>();
  for (const [i, raw] of events.entries()) {
    if (ids.has(raw.eventId)) throw new Error('Duplicate audit event ID.');
    ids.add(raw.eventId);
    const event = { ...structuredClone(raw), sequenceNumber: i + 1, prevHash };
    const eventHash = await computeEventHash(event, prevHash);
    if ((raw.eventHash !== undefined || raw.prevHash !== undefined || raw.sequenceNumber !== undefined) &&
        (raw.eventHash !== eventHash || raw.prevHash !== prevHash || raw.sequenceNumber !== i + 1)) {
      throw new Error('Refusing to rehash an invalid existing ledger entry.');
    }
    result.push({ ...event, eventHash });
    prevHash = eventHash;
  }
  return result;
}
export async function verifyLedgerIntegrity(
  events: readonly AuditEvent[], genesisHash = GENESIS_HASH,
  checkpoint?: { eventCount: number; latestBlockHash: string },
): Promise<LedgerVerificationResult> {
  const chronological = events.length > 1 && (events[0].sequenceNumber ?? 0) > (events.at(-1)?.sequenceNumber ?? 0)
    ? [...events].reverse() : events;
  let prevHash = genesisHash;
  const ids = new Set<string>();
  for (const [i, event] of chronological.entries()) {
    const invalid = (reason: string): LedgerVerificationResult => ({
      isValid: false, verifiedCount: i, genesisHash, latestBlockHash: prevHash,
      brokenAtIndex: i, brokenEventId: event.eventId, reason,
    });
    if (event.sequenceNumber !== i + 1) return invalid('Missing or invalid sequence number.');
    if (event.prevHash !== prevHash) return invalid('Missing or broken previous hash link.');
    if (!event.eventHash || !/^[a-f0-9]{64}$/.test(event.eventHash)) return invalid('Missing or invalid event hash.');
    if (ids.has(event.eventId)) return invalid('Duplicate event ID.');
    ids.add(event.eventId);
    const expected = await computeEventHash(event, prevHash);
    if (event.eventHash !== expected) return invalid('Tampered payload detected: computed digest does not match stored hash.');
    prevHash = expected;
  }
  if (checkpoint && (checkpoint.eventCount !== events.length || checkpoint.latestBlockHash !== prevHash)) {
    return { isValid: false, verifiedCount: events.length, genesisHash, latestBlockHash: prevHash, reason: 'Ledger differs from independently retained checkpoint.' };
  }
  return { isValid: true, verifiedCount: events.length, genesisHash, latestBlockHash: prevHash };
}
/** Append raw events while preserving all earlier commitments. */
export async function appendAuditEvents(existing: readonly AuditEvent[], added: readonly AuditEvent[]): Promise<AuditEvent[]> {
  return chainAuditEvents([...existing, ...added]);
}

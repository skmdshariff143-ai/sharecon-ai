import { useEffect, useRef, useState } from 'react';
import { AuditEvent } from '@/types/reconciliation';
import { appendAuditEvents, getEventPayload } from '@/lib/dataset/audit_ledger';

/** Hash off the render path, retain old commitments and ignore cancelled snapshots. */
export function useAuditLedger(source: readonly AuditEvent[]) {
  const previous = useRef<AuditEvent[]>([]);
  const [snapshot, setSnapshot] = useState<{ source: readonly AuditEvent[]; events: AuditEvent[]; error?: string }>();
  useEffect(() => {
    let active = true;
    async function sign() {
      try {
        const prior = previous.current;
        const prefix = prior[0]?.eventId === source[0]?.eventId ? prior : [];
        if (prefix.length > source.length || prefix.some((event, i) =>
          getEventPayload({ ...source[i], sequenceNumber: i + 1 }, event.prevHash!) !== getEventPayload(event, event.prevHash!))) {
          throw new Error('Existing audit history changed; unable to verify session ledger.');
        }
        const events = await appendAuditEvents(prefix, source.slice(prefix.length));
        if (active) {
          previous.current = events;
          setSnapshot({ source, events });
        }
      } catch {
        if (active) setSnapshot({ source, events: [], error: 'Audit integrity unavailable. Export is blocked.' });
      }
    }
    void sign();
    return () => { active = false; };
  }, [source]);
  return snapshot?.source === source ? snapshot : undefined;
}

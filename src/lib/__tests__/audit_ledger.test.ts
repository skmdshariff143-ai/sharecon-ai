import { describe, it, expect } from 'vitest';
import {
  chainAuditEvents,
  verifyLedgerIntegrity,
  computeEventHash,
  GENESIS_HASH,
} from '../dataset/audit_ledger';
import { AuditEvent } from '@/types/reconciliation';

describe('Tamper-Evident Cryptographic Audit Ledger', () => {
  const sampleEvents: AuditEvent[] = [
    {
      eventId: 'aud_001',
      timestamp: '2026-03-01T10:00:00Z',
      actor: 'SYSTEM_ENGINE',
      action: 'AUTO_RECONCILE',
      entityIds: { paymentId: 'pay_001', settlementId: 'set_001' },
      previousState: 'UNPROCESSED',
      newState: 'AUTO_RECONCILED',
      evidence: { score: 95 },
      confidence: 95,
      reason: 'Exact triad match',
      modelUsed: 'Deterministic-v1',
      fallbackUsed: false,
    },
    {
      eventId: 'aud_002',
      timestamp: '2026-03-01T10:05:00Z',
      actor: 'FINANCE_REVIEWER',
      action: 'MANUAL_APPROVE',
      entityIds: { paymentId: 'pay_002', settlementId: 'set_002' },
      previousState: 'PENDING_REVIEW',
      newState: 'MANUALLY_APPROVED',
      evidence: { note: 'Verified invoice' },
      confidence: 78,
      reason: 'Approved after checking merchant portal',
      modelUsed: 'Human-In-The-Loop',
      fallbackUsed: false,
    },
    {
      eventId: 'aud_003',
      timestamp: '2026-03-01T10:10:00Z',
      actor: 'ADMIN',
      action: 'THRESHOLD_UPDATE',
      entityIds: { batchId: 'batch_001' },
      previousState: '85',
      newState: '80',
      evidence: { threshold: 80 },
      confidence: 100,
      reason: 'Adjusted high confidence threshold to 80%',
      modelUsed: 'Policy-Config',
      fallbackUsed: false,
    },
  ];

  it('creates a valid cryptographic hash chain from Genesis', () => {
    const chained = chainAuditEvents(sampleEvents);

    expect(chained).toHaveLength(3);

    // Block 1
    expect(chained[0].sequenceNumber).toBe(1);
    expect(chained[0].prevHash).toBe(GENESIS_HASH);
    expect(chained[0].eventHash).toHaveLength(64);

    // Block 2
    expect(chained[1].sequenceNumber).toBe(2);
    expect(chained[1].prevHash).toBe(chained[0].eventHash);
    expect(chained[1].eventHash).toHaveLength(64);

    // Block 3
    expect(chained[2].sequenceNumber).toBe(3);
    expect(chained[2].prevHash).toBe(chained[1].eventHash);
    expect(chained[2].eventHash).toHaveLength(64);

    // Verification passes
    const verification = verifyLedgerIntegrity(chained);
    expect(verification.isValid).toBe(true);
    expect(verification.verifiedCount).toBe(3);
    expect(verification.latestBlockHash).toBe(chained[2].eventHash);
  });

  it('detects retroactive modification of an event payload', () => {
    const chained = chainAuditEvents(sampleEvents);

    // Tamper with Block 2 (e.g. maliciously modify reviewer reason / confidence)
    const tampered = [
      chained[0],
      {
        ...chained[1],
        reason: 'TAMPERED REASON: Maliciously forged approval',
      },
      chained[2],
    ];

    const verification = verifyLedgerIntegrity(tampered);
    expect(verification.isValid).toBe(false);
    expect(verification.brokenAtIndex).toBe(1);
    expect(verification.brokenEventId).toBe('aud_002');
    expect(verification.reason).toContain('Tampered payload detected');
  });

  it('detects broken previous hash linkage when blocks are spliced or deleted', () => {
    const chained = chainAuditEvents(sampleEvents);

    // Maliciously delete Block 2 and link Block 3 directly to Block 1 without re-signing
    const spliced = [chained[0], chained[2]];

    const verification = verifyLedgerIntegrity(spliced);
    expect(verification.isValid).toBe(false);
    expect(verification.reason).toBeDefined();
  });

  it('computes deterministic hashes consistently across calls', () => {
    const hash1 = computeEventHash(sampleEvents[0], GENESIS_HASH);
    const hash2 = computeEventHash(sampleEvents[0], GENESIS_HASH);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});

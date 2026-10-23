import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { canonicalJson, computeDeterministicDigest } from '../dataset/digest';
import { chainAuditEvents, appendAuditEvents, verifyLedgerIntegrity } from '../dataset/audit_ledger';
import { buildComplianceAuditPackage, verifyComplianceAuditPackage } from '../dataset/compliance_package';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../engine/matcher';

const data = generateSyntheticDataset(42);
const batch = reconcileBatch(data.payments, data.settlements, data.bankTransactions);

describe('Cryptographic integrity regressions', () => {
  it.each(['', 'abc', '₹ தமிழ் 日本語', 'a'.repeat(100000)])('matches independent Node SHA-256 for UTF-8 input', async text => {
    expect(await computeDeterministicDigest(text)).toBe(createHash('sha256').update(text, 'utf8').digest('hex'));
  });
  it('canonicalizes nested JSON object keys across serialization', () => {
    expect(canonicalJson({ z: [{ b: 1, a: 2 }], a: undefined })).toBe(canonicalJson({ z: [{ a: 2, b: 1 }] }));
  });
  it('rejects unsigned events, stripped commitments and modified evidence', async () => {
    expect((await verifyLedgerIntegrity(batch.auditEvents)).isValid).toBe(false);
    const chain = await chainAuditEvents(batch.auditEvents.slice(0, 3));
    for (const field of ['eventHash', 'prevHash', 'sequenceNumber'] as const) {
      const tampered = structuredClone(chain);
      delete tampered[1][field];
      expect((await verifyLedgerIntegrity(tampered)).isValid).toBe(false);
    }
    chain[1].evidence = { fabricated: true };
    expect((await verifyLedgerIntegrity(chain)).isValid).toBe(false);
    await expect(chainAuditEvents(chain)).rejects.toThrow('invalid existing');
  });
  it('preserves the earlier chain on append and verifies a separately retained checkpoint', async () => {
    const first = await chainAuditEvents(batch.auditEvents.slice(0, 2));
    const chain = await appendAuditEvents(first, batch.auditEvents.slice(2, 3));
    expect(chain.slice(0, 2)).toEqual(first);
    const checkpoint = { eventCount: 3, latestBlockHash: chain[2].eventHash! };
    expect((await verifyLedgerIntegrity([...chain].reverse(), undefined, checkpoint)).isValid).toBe(true);
    expect((await verifyLedgerIntegrity(first, undefined, checkpoint)).isValid).toBe(false);
  });
  it('covers actual amounts, audit reasons, metadata and config in the package digest', async () => {
    const original = await buildComplianceAuditPackage(batch, DEFAULT_ENGINE_CONFIG);
    expect(await verifyComplianceAuditPackage(JSON.parse(JSON.stringify(original)))).toBe(true);
    const mutations = [
      (p: typeof original) => { p.reconciliationLedger.records[0].payment.grossAmount++; },
      (p: typeof original) => { p.auditTrail.events[0].reason = 'Forged'; },
      (p: typeof original) => { p.integrityAttestation.engineConfig.dryRun = false; },
      (p: typeof original) => { p.batchSummary.totalRecords++; },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(original);
      mutate(changed);
      expect(await verifyComplianceAuditPackage(changed)).toBe(false);
    }
  });
});

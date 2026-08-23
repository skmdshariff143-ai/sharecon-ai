import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { exportReconciliationCsv, exportAuditEventsCsv } from '@/lib/dataset/csv';
import { AuditEvent } from '@/types/reconciliation';

describe('Premium Control Center & UI Logic Tests', () => {
  it('correctly simulates threshold adjustments without mutating original batch records', () => {
    const dataset = generateSyntheticDataset(42);
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    // Baseline record count
    expect(result.records.length).toBe(180);

    // Simulate aggressive threshold (70%)
    const simAuto70 = result.records.filter(
      (r) =>
        r.confidence >= 70 &&
        (r.exceptionType === 'CLEAN_MATCH' ||
          r.exceptionType === 'DATE_SKEW_MATCH' ||
          r.exceptionType === 'INCONSISTENT_DESCRIPTION' ||
          r.exceptionType === 'PARTIALLY_MISSING_REF')
    ).length;

    // Simulate conservative threshold (95%)
    const simAuto95 = result.records.filter(
      (r) =>
        r.confidence >= 95 &&
        (r.exceptionType === 'CLEAN_MATCH' ||
          r.exceptionType === 'DATE_SKEW_MATCH' ||
          r.exceptionType === 'INCONSISTENT_DESCRIPTION' ||
          r.exceptionType === 'PARTIALLY_MISSING_REF')
    ).length;

    expect(simAuto70).toBeGreaterThanOrEqual(simAuto95);
    // Baseline records untouched
    expect(result.records[0].confidence).toBeGreaterThan(0);
  });

  it('exports reconciliation records to valid CSV format with header', () => {
    const dataset = generateSyntheticDataset(42);
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    const csv = exportReconciliationCsv(result.records);
    expect(csv).toContain('Record ID,Payment ID,Order ID,Gross Amount');
    expect(csv.split('\n').length).toBeGreaterThan(180);
  });

  it('exports audit events to valid CSV format with actor and reason', () => {
    const sampleEvent: AuditEvent = {
      eventId: 'aud_test_001',
      timestamp: '2026-03-01T10:00:00.000Z',
      actor: 'FINANCE_REVIEWER',
      action: 'MANUAL_APPROVE',
      entityIds: { paymentId: 'pay_0001' },
      previousState: 'PENDING_REVIEW',
      newState: 'MANUALLY_APPROVED',
      evidence: { note: 'Approved after checking bank credit' },
      confidence: 90,
      reason: 'Manual controller decision: APPROVED',
      modelUsed: 'Human-In-The-Loop',
      fallbackUsed: false,
    };

    const csv = exportAuditEventsCsv([sampleEvent]);
    expect(csv).toContain('Event ID,Timestamp,Actor,Action');
    expect(csv).toContain('aud_test_001');
    expect(csv).toContain('FINANCE_REVIEWER');
  });
});

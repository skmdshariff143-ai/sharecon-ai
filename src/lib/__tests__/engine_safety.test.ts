import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch, reconcilePartitionedBatch, DEFAULT_ENGINE_CONFIG } from '../engine/matcher';

function triad() {
  const data = generateSyntheticDataset(42);
  const payment = { ...data.payments[0] };
  const settlement = { ...data.settlements.find(s => s.paymentReference === payment.paymentId)! };
  const bank = { ...data.bankTransactions.find(b => b.utr === settlement.utr)! };
  return { payment, settlement, bank };
}

describe('Engine safety invariants', () => {
  it.each(['failed', 'refunded', 'pending'] as const)('never automatically resolves %s payments', status => {
    const { payment, settlement, bank } = triad();
    expect(reconcileBatch([{ ...payment, status }], [settlement], [bank]).records[0].status).not.toBe('AUTO_RECONCILED');
  });
  it.each(['failed', 'reversed'] as const)('never automatically resolves %s settlements', status => {
    const { payment, settlement, bank } = triad();
    expect(reconcileBatch([payment], [{ ...settlement, status }], [bank]).records[0].status).not.toBe('AUTO_RECONCILED');
  });
  it('holds shared bank credits and reused settlement claims', () => {
    const { payment, settlement, bank } = triad();
    const other = { ...payment, paymentId: 'pay_other', orderId: 'order_other' };
    const second = { ...settlement, settlementId: 'settlement_other', paymentReference: other.paymentId };
    const batch = reconcileBatch([payment, other], [settlement, second], [bank]);
    expect(batch.records.every(r => r.status !== 'AUTO_RECONCILED')).toBe(true);
  });
  it('deduplicates payment/order lookups referring to the same settlement', () => {
    const { payment, settlement, bank } = triad();
    expect(reconcileBatch([{ ...payment, orderId: payment.paymentId }], [settlement], [bank]).records[0].status).toBe('AUTO_RECONCILED');
  });
  it('enforces configured per-leg date windows and chronological ordering', () => {
    const { payment, settlement, bank } = triad();
    expect(reconcileBatch([payment], [settlement], [bank], { ...DEFAULT_ENGINE_CONFIG, maxDateDeltaDays: 0 }).records[0].status).not.toBe('AUTO_RECONCILED');
    expect(reconcileBatch([payment], [settlement], [{ ...bank, creditedAt: '2025-01-01' }]).records[0].status).not.toBe('AUTO_RECONCILED');
  });
  it('rejects malformed inputs, duplicate IDs and invalid policy', () => {
    const { payment, settlement, bank } = triad();
    expect(() => reconcileBatch([{ ...payment, grossAmount: NaN }], [settlement], [bank])).toThrow();
    expect(() => reconcileBatch([payment, payment], [settlement], [bank])).toThrow('Duplicate');
    expect(() => reconcileBatch([payment], [settlement], [bank], { ...DEFAULT_ENGINE_CONFIG, maxDateDeltaDays: NaN })).toThrow();
  });
  it('actually holds automatic decisions and updates audit events on a batch circuit break', () => {
    const { payment, settlement, bank } = triad();
    const missing = { ...payment, paymentId: 'missing', orderId: 'missing', grossAmount: payment.grossAmount + 1, expectedNetAmount: payment.expectedNetAmount + 1 };
    const batch = reconcileBatch([payment, missing], [settlement], [bank]);
    expect(batch.circuitBreakerTriggered).toBe(true);
    expect(batch.records[0].status).toBe('PENDING_REVIEW');
    expect(batch.auditEvents[0].newState).toBe('PENDING_REVIEW');
    expect(batch.auditEvents[0].action).toBe('BATCH_RUN');
  });
  it.each([1, 2, 4, 7])('preserves full matching results and global hold semantics in %i partitions', numPartitions => {
    const data = generateSyntheticDataset(42);
    data.settlements[0] = { ...data.settlements[0], paymentReference: data.settlements[0].paymentReference.toUpperCase() };
    const config = { ...DEFAULT_ENGINE_CONFIG, circuitBreakerThresholdPercent: 10 };
    const single = reconcileBatch(data.payments, data.settlements, data.bankTransactions, config);
    const partitioned = reconcilePartitionedBatch(data.payments, data.settlements, data.bankTransactions, config, [], { numPartitions });
    expect(partitioned.combinedResult.records).toEqual(single.records);
    expect(partitioned.combinedResult.circuitBreakerTriggered).toBe(single.circuitBreakerTriggered);
  });
  it.each([0, -1, 1.5, Infinity, 65])('rejects invalid partition count %s', numPartitions => {
    expect(() => reconcilePartitionedBatch([], [], [], DEFAULT_ENGINE_CONFIG, [], { numPartitions })).toThrow();
  });
});

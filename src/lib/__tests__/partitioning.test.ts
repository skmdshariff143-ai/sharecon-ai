import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../dataset/generator';
import {
  reconcileBatch,
  reconcilePartitionedBatch,
  partitionDatasetByDateAndMerchant,
  DEFAULT_ENGINE_CONFIG,
} from '../engine/matcher';

describe('Partition-Ready Matching Engine & Equivalence', () => {
  it('accepts explicit partitionContext and stamps it into batch result', () => {
    const dataset = generateSyntheticDataset(42);
    const partitionContext = {
      partitionKey: 'MID_CORP_001#2026-03-01',
      merchantId: 'MID_CORP_001',
      dateBucket: '2026-03-01',
      partitionIndex: 1,
      totalPartitions: 4,
    };

    const result = reconcileBatch(
      dataset.payments.slice(0, 10),
      dataset.settlements.slice(0, 10),
      dataset.bankTransactions.slice(0, 10),
      DEFAULT_ENGINE_CONFIG,
      [],
      partitionContext
    );

    expect(result.partitionContext).toEqual(partitionContext);
    expect(result.records.length).toBe(10);
  });

  it('partitions dataset deterministically into N subsets without dropping records', () => {
    const dataset = generateSyntheticDataset(42);
    const numPartitions = 4;

    const partitions = partitionDatasetByDateAndMerchant(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      { numPartitions }
    );

    expect(partitions).toHaveLength(numPartitions);

    const totalPaymentsInPartitions = partitions.reduce((sum, p) => sum + p.payments.length, 0);
    expect(totalPaymentsInPartitions).toBe(dataset.payments.length);

    const totalSettlementsInPartitions = partitions.reduce((sum, p) => sum + p.settlements.length, 0);
    expect(totalSettlementsInPartitions).toBe(dataset.settlements.length);

    const totalBankInPartitions = partitions.reduce((sum, p) => sum + p.bankTransactions.length, 0);
    expect(totalBankInPartitions).toBe(dataset.bankTransactions.length);
  });

  it('produces identical record match counts between partitioned and single-batch execution', () => {
    const dataset = generateSyntheticDataset(42);

    // 1. Single-batch execution
    const singleBatch = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    // 2. 4-way partitioned execution
    const partitioned = reconcilePartitionedBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG,
      [],
      { numPartitions: 4 }
    );

    expect(partitioned.partitionCount).toBe(4);
    expect(partitioned.combinedResult.records.length).toBe(singleBatch.records.length);

    const singleAuto = singleBatch.records.filter((r) => r.status === 'AUTO_RECONCILED').length;
    const partAuto = partitioned.combinedResult.records.filter((r) => r.status === 'AUTO_RECONCILED').length;

    expect(partAuto).toBe(singleAuto);
  });
});

/**
 * Performance Measurement Benchmark for ShaRecon AI
 * 
 * Executes warm-up and measured iterations across synthetic and held-out datasets.
 * Reports median, p95, records/sec, dataset size, Node version, and platform.
 * Distinguishes pure matching execution from artifact/disk I/O.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateSyntheticDataset } from '../src/lib/dataset/generator';
import { HELD_OUT_DATASET } from '../src/lib/dataset/held_out_dataset';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../src/lib/engine/matcher';

interface PerformanceSummary {
  metadata: {
    benchmarkTimestamp: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuModel: string;
    cpuCores: number;
    disclaimer: string;
  };
  syntheticBenchmark180: {
    warmupIterations: number;
    measuredIterations: number;
    totalRecords: number;
    durationsMs: {
      min: number;
      median: number;
      p95: number;
      max: number;
      mean: number;
    };
    throughputRecordsPerSec: number;
  };
  heldOutBenchmark80: {
    warmupIterations: number;
    measuredIterations: number;
    totalRecords: number;
    durationsMs: {
      min: number;
      median: number;
      p95: number;
      max: number;
      mean: number;
    };
    throughputRecordsPerSec: number;
  };
}

function percentile(sortedArr: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return Number(sortedArr[Math.max(0, index)].toFixed(3));
}

function runBenchmark() {
  console.log('Starting ShaRecon AI Performance Benchmark...\n');

  // Datasets
  const synthetic180 = generateSyntheticDataset(42);
  const heldOut80 = HELD_OUT_DATASET;

  const WARMUP_COUNT = 25;
  const MEASURED_COUNT = 100;

  // 1. Synthetic 180 Warm-up
  for (let i = 0; i < WARMUP_COUNT; i++) {
    reconcileBatch(
      synthetic180.payments,
      synthetic180.settlements,
      synthetic180.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
  }

  // 2. Synthetic 180 Measurement
  const synthDurations: number[] = [];
  for (let i = 0; i < MEASURED_COUNT; i++) {
    const t0 = performance.now();
    reconcileBatch(
      synthetic180.payments,
      synthetic180.settlements,
      synthetic180.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const t1 = performance.now();
    synthDurations.push(t1 - t0);
  }
  synthDurations.sort((a, b) => a - b);

  // 3. Held-Out 80 Warm-up
  const heldOutPayments = [...heldOut80.payments];
  const heldOutSettlements = [...heldOut80.settlements];
  const heldOutBankTx = [...heldOut80.bankTransactions];

  for (let i = 0; i < WARMUP_COUNT; i++) {
    reconcileBatch(
      heldOutPayments,
      heldOutSettlements,
      heldOutBankTx,
      DEFAULT_ENGINE_CONFIG
    );
  }

  // 4. Held-Out 80 Measurement
  const heldOutDurations: number[] = [];
  for (let i = 0; i < MEASURED_COUNT; i++) {
    const t0 = performance.now();
    reconcileBatch(
      heldOutPayments,
      heldOutSettlements,
      heldOutBankTx,
      DEFAULT_ENGINE_CONFIG
    );
    const t1 = performance.now();
    heldOutDurations.push(t1 - t0);
  }
  heldOutDurations.sort((a, b) => a - b);

  // Compute stats
  const synthMedian = percentile(synthDurations, 50);
  const synthP95 = percentile(synthDurations, 95);
  const synthMin = Number(synthDurations[0].toFixed(3));
  const synthMax = Number(synthDurations[synthDurations.length - 1].toFixed(3));
  const synthMean = Number((synthDurations.reduce((a, b) => a + b, 0) / MEASURED_COUNT).toFixed(3));
  const synthThroughput = Math.round((180 / (synthMedian / 1000)));

  const heldOutMedian = percentile(heldOutDurations, 50);
  const heldOutP95 = percentile(heldOutDurations, 95);
  const heldOutMin = Number(heldOutDurations[0].toFixed(3));
  const heldOutMax = Number(heldOutDurations[heldOutDurations.length - 1].toFixed(3));
  const heldOutMean = Number((heldOutDurations.reduce((a, b) => a + b, 0) / MEASURED_COUNT).toFixed(3));
  const heldOutThroughput = Math.round((80 / (heldOutMedian / 1000)));

  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';

  const summary: PerformanceSummary = {
    metadata: {
      benchmarkTimestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpuModel,
      cpuCores: cpus.length,
      disclaimer: 'Performance measurements are environment-specific and are not production guarantees.',
    },
    syntheticBenchmark180: {
      warmupIterations: WARMUP_COUNT,
      measuredIterations: MEASURED_COUNT,
      totalRecords: 180,
      durationsMs: {
        min: synthMin,
        median: synthMedian,
        p95: synthP95,
        max: synthMax,
        mean: synthMean,
      },
      throughputRecordsPerSec: synthThroughput,
    },
    heldOutBenchmark80: {
      warmupIterations: WARMUP_COUNT,
      measuredIterations: MEASURED_COUNT,
      totalRecords: 80,
      durationsMs: {
        min: heldOutMin,
        median: heldOutMedian,
        p95: heldOutP95,
        max: heldOutMax,
        mean: heldOutMean,
      },
      throughputRecordsPerSec: heldOutThroughput,
    },
  };

  const outDir = path.resolve(__dirname, '../docs/generated');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Write performance-latest.json
  const jsonPath = path.join(outDir, 'performance-latest.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`Wrote performance JSON to: ${jsonPath}`);

  // 2. Write PERFORMANCE_REPORT.md
  const mdPath = path.join(outDir, 'PERFORMANCE_REPORT.md');
  const mdContent = `# ShaRecon AI — Engine Performance Benchmark Report

> **Disclaimer**: *Performance measurements are environment-specific and are not production guarantees.*  
> **Benchmark Timestamp**: \`${summary.metadata.benchmarkTimestamp}\`  
> **Runtime**: Node.js \`${summary.metadata.nodeVersion}\` (${summary.metadata.platform}, ${summary.metadata.arch})  
> **CPU**: ${summary.metadata.cpuModel} (${summary.metadata.cpuCores} cores)  
> **Methodology**: Evaluates pure in-memory deterministic 3-way matching execution time (\`reconcileBatch\`) separated from disk I/O, report compilation, and UI rendering.

---

## 1. Measured Performance Results

| Benchmark Dataset | Total Records | Warm-Up Runs | Measured Runs | Min Latency | Median (p50) | p95 Latency | Max Latency | Throughput (Rec/sec) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Synthetic Multi-Leg (Seed 42)** | 180 | ${WARMUP_COUNT} | ${MEASURED_COUNT} | ${synthMin} ms | **${synthMedian} ms** | **${synthP95} ms** | ${synthMax} ms | **${synthThroughput.toLocaleString()} rec/sec** |
| **Held-Out Adversarial Fixture** | 80 | ${WARMUP_COUNT} | ${MEASURED_COUNT} | ${heldOutMin} ms | **${heldOutMedian} ms** | **${heldOutP95} ms** | ${heldOutMax} ms | **${heldOutThroughput.toLocaleString()} rec/sec** |

---

## 2. Measurement Context & Methodology

1. **Isolation of Matching Time**: Measurements use high-resolution timers (\`performance.now()\`) strictly wrapping \`reconcileBatch()\`. File system I/O, report generation, and JSON formatting are explicitly excluded from latency metrics.
2. **Warm-Up Execution**: ${WARMUP_COUNT} iterations are executed prior to data collection to ensure V8 JIT compilation and inline caching have stabilized.
3. **Statistical Aggregation**: ${MEASURED_COUNT} consecutive runs are sorted to calculate empirical percentiles (Median and p95).
`;

  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`Wrote performance markdown report to: ${mdPath}`);

  console.log('\n--- PERFORMANCE BENCHMARK SUMMARY ---');
  console.log(`Synthetic 180: Median = ${synthMedian} ms | p95 = ${synthP95} ms | Throughput = ${synthThroughput.toLocaleString()} rec/sec`);
  console.log(`Held-Out 80:   Median = ${heldOutMedian} ms | p95 = ${heldOutP95} ms | Throughput = ${heldOutThroughput.toLocaleString()} rec/sec`);
}

runBenchmark();

/**
 * Benchmark Artifact Generator for ShaRecon AI
 * Executes the canonical evaluation pipeline and outputs committed JSON and Markdown benchmark files.
 */

import fs from 'fs';
import path from 'path';
import { generateSyntheticDataset } from '../src/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '../src/lib/engine/matcher';
import {
  evaluateReconciliation,
  runMultiSeedBenchmark,
  simulatePolicyThresholds,
} from '../src/lib/engine/evaluator';
import { STANDARD_POLICY_PROFILES } from '../src/types/reconciliation';

function main() {
  const outputDir = path.resolve(__dirname, '../docs/generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Seed 42 Canonical Baseline Evaluation
  const seed42 = generateSyntheticDataset(42);
  const start = performance.now();
  const baseResult = reconcileBatch(
    seed42.payments,
    seed42.settlements,
    seed42.bankTransactions,
    DEFAULT_ENGINE_CONFIG
  );
  const duration = performance.now() - start;
  const baseMetrics = evaluateReconciliation(baseResult.records, seed42.groundTruth, duration);

  // 2. Multi-Seed Benchmark Evaluation
  const seeds = [42, 101, 777, 2024, 9999];
  const multiSeedResults = runMultiSeedBenchmark(seeds, DEFAULT_ENGINE_CONFIG);

  // 3. 5-Policy Simulation Matrix Evaluation (Seed 42)
  const policyResults = STANDARD_POLICY_PROFILES.map((policy) => {
    const res = simulatePolicyThresholds(
      seed42.payments,
      seed42.settlements,
      seed42.bankTransactions,
      seed42.groundTruth,
      policy.highThreshold,
      policy.mediumThreshold,
      DEFAULT_ENGINE_CONFIG
    );
    return {
      id: policy.id,
      name: policy.name,
      tag: policy.tag,
      description: policy.description,
      highThreshold: policy.highThreshold,
      mediumThreshold: policy.mediumThreshold,
      autoReconciledCount: res.autoReconciledCount,
      autoReconciliationRate: res.autoReconciliationRate,
      reviewCount: res.reviewCount,
      reviewRate: res.reviewRate,
      exceptionCount: res.exceptionCount,
      exceptionRate: res.exceptionRate,
      autoResolutionPrecision: res.autoResolutionPrecision,
      autoResolutionRecall: res.autoResolutionRecall,
      reviewRoutingAccuracy: res.reviewRoutingAccuracy,
      falsePositiveCount: res.falsePositiveCount,
      falsePositiveExposurePaise: res.falsePositiveExposurePaise,
    };
  });

  // Compile JSON artifact
  const benchmarkArtifact = {
    metadata: {
      generatedAt: new Date().toISOString(),
      engineVersion: '0.1.0',
      totalBenchmarkSeeds: seeds.length,
      defaultSeed: 42,
      currency: 'INR (Paise Integer Arithmetic)',
    },
    baselineBenchmark: {
      seed: 42,
      totalRecordsProcessed: baseMetrics.totalRecordsProcessed,
      totalGrossAmountPaise: baseMetrics.totalGrossAmountPaise,
      matchedAmountPaise: baseMetrics.matchedAmountPaise,
      amountCoverageRate: baseMetrics.amountCoverageRate,
      autoReconciledCount: baseMetrics.autoReconciledCount,
      autoReconciliationRate: baseMetrics.autoReconciliationRate,
      manualReviewCount: baseMetrics.manualReviewCount,
      manualReviewRate: baseMetrics.manualReviewRate,
      exceptionCount: baseMetrics.exceptionCount,
      proposedPairPrecision: baseMetrics.proposedPairPrecision,
      proposedPairRecall: baseMetrics.proposedPairRecall,
      autoResolutionPrecision: baseMetrics.autoResolutionPrecision,
      autoResolutionRecall: baseMetrics.autoResolutionRecall,
      reviewRoutingAccuracy: baseMetrics.reviewRoutingAccuracy,
      exceptionDetectionAccuracy: baseMetrics.exceptionDetectionAccuracy,
      falsePositiveExposurePaise: baseMetrics.falsePositiveExposurePaise,
      processingDurationMs: Number(duration.toFixed(2)),
      errorCount: baseMetrics.errors.length,
    },
    policySimulationMatrix: policyResults,
    multiSeedBenchmark: multiSeedResults,
  };

  // Write JSON artifact
  const jsonPath = path.join(outputDir, 'benchmark.json');
  fs.writeFileSync(jsonPath, JSON.stringify(benchmarkArtifact, null, 2), 'utf-8');
  console.log(`Wrote JSON benchmark artifact to: ${jsonPath}`);

  // Compile Markdown artifact
  let mdContent = `# ShaRecon AI — Verified Canonical Benchmark Artifacts\n\n`;
  mdContent += `> Generated on \`${benchmarkArtifact.metadata.generatedAt}\` directly from the canonical evaluation engine.\n\n`;
  mdContent += `## 1. Immutable Baseline Benchmark (Seed 42)\n\n`;
  mdContent += `| Metric | Measured Value | Integer Formula / Standard |\n`;
  mdContent += `| :--- | :--- | :--- |\n`;
  mdContent += `| **Total Records** | ${baseMetrics.totalRecordsProcessed} records | 180 synthetic multi-leg cases |\n`;
  mdContent += `| **Total Volume** | ₹${(baseMetrics.totalGrossAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | ${baseMetrics.totalGrossAmountPaise} paise |\n`;
  mdContent += `| **Auto-Reconciled Count** | ${baseMetrics.autoReconciledCount} records (${(baseMetrics.autoReconciliationRate * 100).toFixed(1)}%) | High-confidence safe matches |\n`;
  mdContent += `| **Review Queue Count** | ${baseMetrics.manualReviewCount} cases (${(baseMetrics.manualReviewRate * 100).toFixed(1)}%) | Medium-confidence triage |\n`;
  mdContent += `| **Exception Count** | ${baseMetrics.exceptionCount} records (${((baseMetrics.exceptionCount / baseMetrics.totalRecordsProcessed) * 100).toFixed(1)}%) | Unmatched / anomalous |\n`;
  mdContent += `| **Proposed-Pair Precision** | ${(baseMetrics.proposedPairPrecision * 100).toFixed(1)}% | Correct Proposed Pairs / Total Proposed Pairs |\n`;
  mdContent += `| **Proposed-Pair Recall** | ${(baseMetrics.proposedPairRecall * 100).toFixed(1)}% | Correct Proposed Pairs / Expected GT Pairs |\n`;
  mdContent += `| **Auto-Resolution Precision** | ${(baseMetrics.autoResolutionPrecision * 100).toFixed(1)}% | Safe Auto / Total Auto-Reconciled |\n`;
  mdContent += `| **Auto-Resolution Recall** | ${(baseMetrics.autoResolutionRecall * 100).toFixed(1)}% | Safe Auto / Total GT Safe |\n`;
  mdContent += `| **Review-Routing Accuracy** | ${(baseMetrics.reviewRoutingAccuracy * 100).toFixed(1)}% | Correct Review Routed / Expected GT Review |\n`;
  mdContent += `| **Exception Classification Acc** | ${(baseMetrics.exceptionDetectionAccuracy * 100).toFixed(1)}% | Correct Exception Type / Total Records |\n`;
  mdContent += `| **False-Positive Exposure** | ₹${(baseMetrics.falsePositiveExposurePaise / 100).toFixed(2)} | Sum of Unsafe Auto Gross Paie |\n\n`;

  mdContent += `## 2. Multi-Policy Simulation Trade-Off Matrix (Seed 42)\n\n`;
  mdContent += `| Policy Profile | Tag | Thresholds | Auto Rate | Review Rate | Exception Rate | Auto Precision | Review Routing | FP Exposure |\n`;
  mdContent += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  policyResults.forEach((p) => {
    mdContent += `| **${p.name}** | \`${p.tag}\` | ${p.highThreshold}% / ${p.mediumThreshold}% | ${(p.autoReconciliationRate * 100).toFixed(1)}% (${p.autoReconciledCount}) | ${(p.reviewRate * 100).toFixed(1)}% (${p.reviewCount}) | ${(p.exceptionRate * 100).toFixed(1)}% (${p.exceptionCount}) | ${(p.autoResolutionPrecision * 100).toFixed(1)}% | ${(p.reviewRoutingAccuracy * 100).toFixed(1)}% | ₹${(p.falsePositiveExposurePaise / 100).toFixed(2)} |\n`;
  });

  mdContent += `\n## 3. Multi-Seed Robustness Benchmark\n\n`;
  mdContent += `| Seed | Total Records | Proposed-Pair Precision | Proposed-Pair Recall | Auto-Resolution Precision | Auto-Resolution Recall | Review-Routing Acc | FP Exposure |\n`;
  mdContent += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  multiSeedResults.forEach((s) => {
    mdContent += `| **${s.seed}** | ${s.totalRecords} | ${(s.proposedPairPrecision * 100).toFixed(1)}% | ${(s.proposedPairRecall * 100).toFixed(1)}% | ${(s.autoResolutionPrecision * 100).toFixed(1)}% | ${(s.autoResolutionRecall * 100).toFixed(1)}% | ${(s.reviewRoutingAccuracy * 100).toFixed(1)}% | ₹${(s.falsePositiveExposurePaise / 100).toFixed(2)} |\n`;
  });

  const mdPath = path.join(outputDir, 'benchmark.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`Wrote Markdown benchmark artifact to: ${mdPath}`);
}

main();

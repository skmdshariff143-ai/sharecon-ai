import { useState, useMemo, useCallback } from 'react';
import {
  ReconciliationRecord,
  GroundTruth,
  Payment,
  Settlement,
  BankTransaction,
  SeedBenchmarkResult,
  PolicySimulationResult,
  STANDARD_POLICY_PROFILES,
  ExceptionType,
  EvaluationMetrics,
} from '@/types/reconciliation';
import {
  runMultiSeedBenchmark,
  simulatePolicyThresholds,
  evaluateHeldOutBenchmark,
  HeldOutBenchmarkResult,
} from '@/lib/engine/evaluator';

export interface MultiSeedAverages {
  proposedPairPrecision: string;
  proposedPairRecall: string;
  autoResolutionPrecision: string;
  autoResolutionRecall: string;
  reviewRoutingAccuracy: string;
  exceptionAccuracy: string;
  autoReconciliationRate: string;
  falsePositiveExposurePaise: number;
}

export interface HeldOutCategoryGroup {
  category: ExceptionType;
  total: number;
  contained: number;
  containedPct: number;
  autoLeakage: number;
}

export interface HeldOutErrorStats {
  byCategory: Record<string, number>;
  byExpectedOutcome: Record<string, number>;
}

export interface UseEvaluationMetricsProps {
  records?: ReconciliationRecord[];
  groundTruth?: GroundTruth[];
  payments?: Payment[];
  settlements?: Settlement[];
  bankTransactions?: BankTransaction[];
}

export interface EvaluationMetricsState {
  simHighThreshold: number;
  setSimHighThreshold: (val: number) => void;
  simMediumThreshold: number;
  setSimMediumThreshold: (val: number) => void;
  multiSeedResults: SeedBenchmarkResult[];
  isCalculatingBenchmark: boolean;
  calculateBenchmark: () => void;
  benchmarkMode: 'SYNTHETIC' | 'HELD_OUT';
  setBenchmarkMode: (mode: 'SYNTHETIC' | 'HELD_OUT') => void;
  multiSeedAverages: MultiSeedAverages;
  simulatedPolicyResult: PolicySimulationResult;
  comparativePolicies: (typeof STANDARD_POLICY_PROFILES[number] & {
    simulation: PolicySimulationResult;
  })[];
  heldOutResult: HeldOutBenchmarkResult;
  heldOutCategories: HeldOutCategoryGroup[];
  heldOutErrors: EvaluationMetrics['errors'];
  heldOutErrorStats: HeldOutErrorStats;
  exportComparisonCSV: () => void;
}

export function useEvaluationMetrics({
  records = [],
  groundTruth = [],
  payments = [],
  settlements = [],
  bankTransactions = [],
}: UseEvaluationMetricsProps): EvaluationMetricsState {
  // Live Confidence Threshold Simulator state
  const [simHighThreshold, setSimHighThreshold] = useState<number>(85);
  const [simMediumThreshold, setSimMediumThreshold] = useState<number>(50);

  // Multi-Seed Benchmark state (computed dynamically on mount & on demand)
  const [multiSeedResults, setMultiSeedResults] = useState<SeedBenchmarkResult[]>(() =>
    runMultiSeedBenchmark([42, 101, 777, 2024, 9999])
  );
  const [isCalculatingBenchmark, setIsCalculatingBenchmark] = useState<boolean>(false);

  // Benchmark View Mode: Synthetic Generator vs Held-Out Adversarial
  const [benchmarkMode, setBenchmarkMode] = useState<'SYNTHETIC' | 'HELD_OUT'>('SYNTHETIC');

  // Held-Out Benchmark Result (Computed with immutable held-out dataset)
  const heldOutResult = useMemo<HeldOutBenchmarkResult>(() => {
    return evaluateHeldOutBenchmark();
  }, []);

  // Run real multi-seed benchmark computation on demand
  const calculateBenchmark = useCallback(() => {
    setIsCalculatingBenchmark(true);
    setTimeout(() => {
      try {
        const results = runMultiSeedBenchmark([42, 101, 777, 2024, 9999]);
        setMultiSeedResults(results);
      } catch (err) {
        console.error('Multi-seed benchmark calculation error:', err);
      } finally {
        setIsCalculatingBenchmark(false);
      }
    }, 50);
  }, []);

  // Derive inputs for simulation from records if explicit payment arrays not passed
  const effectivePayments = useMemo(() => {
    if (payments.length > 0) return payments;
    return records.map((r) => r.payment);
  }, [payments, records]);

  const effectiveSettlements = useMemo(() => {
    if (settlements.length > 0) return settlements;
    return records
      .map((r) => r.matchedSettlement)
      .filter((s): s is Settlement => s !== null);
  }, [settlements, records]);

  const effectiveBankTransactions = useMemo(() => {
    if (bankTransactions.length > 0) return bankTransactions;
    return records
      .map((r) => r.matchedBankTransaction)
      .filter((b): b is BankTransaction => b !== null);
  }, [bankTransactions, records]);

  // Compute live simulated policy result
  const simulatedPolicyResult = useMemo(() => {
    return simulatePolicyThresholds(
      effectivePayments,
      effectiveSettlements,
      effectiveBankTransactions,
      groundTruth,
      simHighThreshold,
      simMediumThreshold
    );
  }, [
    effectivePayments,
    effectiveSettlements,
    effectiveBankTransactions,
    groundTruth,
    simHighThreshold,
    simMediumThreshold,
  ]);

  // Compute 5 standard policy comparison rows
  const comparativePolicies = useMemo(() => {
    return STANDARD_POLICY_PROFILES.map((profile) => {
      const sim = simulatePolicyThresholds(
        effectivePayments,
        effectiveSettlements,
        effectiveBankTransactions,
        groundTruth,
        profile.highThreshold,
        profile.mediumThreshold
      );
      return {
        ...profile,
        simulation: sim,
      };
    });
  }, [effectivePayments, effectiveSettlements, effectiveBankTransactions, groundTruth]);

  // Multi-Seed Averages
  const multiSeedAverages: MultiSeedAverages = useMemo(() => {
    if (multiSeedResults.length === 0) {
      return {
        proposedPairPrecision: '0.0%',
        proposedPairRecall: '0.0%',
        autoResolutionPrecision: '0.0%',
        autoResolutionRecall: '0.0%',
        reviewRoutingAccuracy: '0.0%',
        exceptionAccuracy: '0.0%',
        autoReconciliationRate: '0.0%',
        falsePositiveExposurePaise: 0,
      };
    }
    const sum = multiSeedResults.reduce(
      (acc, r) => ({
        proposedPairPrecision:
          acc.proposedPairPrecision + r.proposedPairPrecision,
        proposedPairRecall:
          acc.proposedPairRecall + r.proposedPairRecall,
        autoResolutionPrecision:
          acc.autoResolutionPrecision + r.autoResolutionPrecision,
        autoResolutionRecall:
          acc.autoResolutionRecall + r.autoResolutionRecall,
        reviewRoutingAccuracy:
          acc.reviewRoutingAccuracy + r.reviewRoutingAccuracy,
        exceptionAccuracy:
          acc.exceptionAccuracy + r.exceptionAccuracy,
        autoReconciliationRate:
          acc.autoReconciliationRate + r.autoReconciliationRate,
        falsePositiveExposurePaise:
          acc.falsePositiveExposurePaise + r.falsePositiveExposurePaise,
      }),
      {
        proposedPairPrecision: 0,
        proposedPairRecall: 0,
        autoResolutionPrecision: 0,
        autoResolutionRecall: 0,
        reviewRoutingAccuracy: 0,
        exceptionAccuracy: 0,
        autoReconciliationRate: 0,
        falsePositiveExposurePaise: 0,
      }
    );
    const n = multiSeedResults.length;
    return {
      proposedPairPrecision: `${((sum.proposedPairPrecision / n) * 100).toFixed(1)}%`,
      proposedPairRecall: `${((sum.proposedPairRecall / n) * 100).toFixed(1)}%`,
      autoResolutionPrecision: `${((sum.autoResolutionPrecision / n) * 100).toFixed(1)}%`,
      autoResolutionRecall: `${((sum.autoResolutionRecall / n) * 100).toFixed(1)}%`,
      reviewRoutingAccuracy: `${((sum.reviewRoutingAccuracy / n) * 100).toFixed(1)}%`,
      exceptionAccuracy: `${((sum.exceptionAccuracy / n) * 100).toFixed(1)}%`,
      autoReconciliationRate: `${((sum.autoReconciliationRate / n) * 100).toFixed(1)}%`,
      falsePositiveExposurePaise: Math.round(sum.falsePositiveExposurePaise / n),
    };
  }, [multiSeedResults]);

  // Held-Out Categories
  const heldOutCategories: HeldOutCategoryGroup[] = useMemo(() => {
    const categoryMap = new Map<
      ExceptionType,
      { total: number; contained: number; autoLeakage: number }
    >();

    const recordMap = new Map<string, ReconciliationRecord>();
    heldOutResult.records.forEach((r) => recordMap.set(r.payment.paymentId, r));

    heldOutResult.groundTruth.forEach((gt) => {
      const rec = recordMap.get(gt.paymentId);
      const cat = gt.expectedExceptionType;
      const current = categoryMap.get(cat) || { total: 0, contained: 0, autoLeakage: 0 };
      current.total += 1;

      const isContained =
        rec &&
        (rec.status === 'PENDING_REVIEW' ||
          rec.status === 'UNMATCHED_EXCEPTION' ||
          (rec.status === 'AUTO_RECONCILED' && gt.expectedOutcome === 'auto_reconciled'));

      if (isContained) current.contained += 1;
      if (rec && rec.status === 'AUTO_RECONCILED' && gt.expectedOutcome !== 'auto_reconciled') {
        current.autoLeakage += 1;
      }
      categoryMap.set(cat, current);
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      contained: stats.contained,
      containedPct: stats.total > 0 ? (stats.contained / stats.total) * 100 : 0,
      autoLeakage: stats.autoLeakage,
    }));
  }, [heldOutResult]);

  // Held-Out Error Breakdown
  const heldOutErrors = useMemo(
    () => heldOutResult.evaluation?.errors || [],
    [heldOutResult]
  );

  const heldOutErrorStats: HeldOutErrorStats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byExpectedOutcome: Record<string, number> = {};

    heldOutErrors.forEach((e) => {
      const cat = e.expectedExceptionType;
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      const exp = e.expectedOutcome;
      byExpectedOutcome[exp] = (byExpectedOutcome[exp] || 0) + 1;
    });

    return { byCategory, byExpectedOutcome };
  }, [heldOutErrors]);

  const exportComparisonCSV = useCallback(() => {
    const allPolicies = [
      ...comparativePolicies.map((p) => ({
        name: p.name,
        tag: p.tag,
        highThreshold: p.highThreshold,
        mediumThreshold: p.mediumThreshold,
        res: p.simulation,
      })),
      {
        name: 'Custom Simulator',
        tag: 'User Defined',
        highThreshold: simHighThreshold,
        mediumThreshold: simMediumThreshold,
        res: simulatedPolicyResult,
      },
    ];

    let csv =
      'Policy,Tag,High Threshold,Med Threshold,Auto Rate,Review Rate,Exception Rate,Auto Precision,Auto Recall,Review Routing,FP Count,FP Exposure (INR)\n';
    allPolicies.forEach((p) => {
      const res = p.res;
      csv += `"${p.name}","${p.tag}",${p.highThreshold}%,${p.mediumThreshold}%,${(res.autoReconciliationRate * 100).toFixed(1)}%,${(res.reviewRate * 100).toFixed(1)}%,${(res.exceptionRate * 100).toFixed(1)}%,${(res.autoResolutionPrecision * 100).toFixed(1)}%,${(res.autoResolutionRecall * 100).toFixed(1)}%,${(res.reviewRoutingAccuracy * 100).toFixed(1)}%,${res.falsePositiveCount},${(res.falsePositiveExposurePaise / 100).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharecon_policy_comparison_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [comparativePolicies, simHighThreshold, simMediumThreshold, simulatedPolicyResult]);

  return {
    simHighThreshold,
    setSimHighThreshold,
    simMediumThreshold,
    setSimMediumThreshold,
    multiSeedResults,
    isCalculatingBenchmark,
    calculateBenchmark,
    benchmarkMode,
    setBenchmarkMode,
    multiSeedAverages,
    simulatedPolicyResult,
    comparativePolicies,
    heldOutResult,
    heldOutCategories,
    heldOutErrors,
    heldOutErrorStats,
    exportComparisonCSV,
  };
}

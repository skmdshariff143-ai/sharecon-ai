/**
 * Ground Truth Evaluation Engine for ShaRecon AI
 * Accurately and honestly measures separated metrics:
 * 1. Proposed-Pair Precision & Recall (Entity matching accuracy)
 * 2. Auto-Resolution Precision & Recall (Safety workflow accuracy)
 * 3. Review-Routing Accuracy
 * 4. Exception Classification Accuracy
 * 5. False-Positive Monetary Exposure (Rupee exposure of unsafe auto-matches)
 */

import {
  ReconciliationRecord,
  GroundTruth,
  EvaluationMetrics,
  ErrorInspectionItem,
} from '@/types/reconciliation';

export function evaluateReconciliation(
  records: ReconciliationRecord[],
  groundTruth: GroundTruth[],
  processingDurationMs = 0
): EvaluationMetrics {
  const gtByPaymentId = new Map<string, GroundTruth>();
  groundTruth.forEach((gt) => gtByPaymentId.set(gt.paymentId, gt));

  let totalProposedPairs = 0;
  let correctProposedPairs = 0;
  let totalExpectedPairs = 0;

  let totalAutoReconciled = 0;
  let correctAutoReconciled = 0;
  let totalExpectedAutoSafe = 0;

  let totalExpectedReview = 0;
  let correctReviewRouted = 0;

  let correctExceptionCount = 0;
  let autoReconciledCount = 0;
  let manualReviewCount = 0;
  let exceptionCount = 0;

  let totalGrossAmountPaise = 0;
  let matchedAmountPaise = 0;
  let falsePositiveExposurePaise = 0;
  let totalFinancialExposurePaise = 0;

  const errors: ErrorInspectionItem[] = [];

  // 1. Calculate expected ground truth counts
  groundTruth.forEach((gt) => {
    if (gt.expectedSettlementId !== null && gt.expectedBankTransactionId !== null) {
      totalExpectedPairs++;
    }
    if (gt.expectedOutcome === 'auto_reconciled') {
      totalExpectedAutoSafe++;
    } else if (gt.expectedOutcome === 'manual_review') {
      totalExpectedReview++;
    }
  });

  // 2. Evaluate each predicted record against ground truth
  records.forEach((record) => {
    const gt = gtByPaymentId.get(record.payment.paymentId);
    const grossPaise = record.payment.grossAmount;
    totalGrossAmountPaise += grossPaise;
    totalFinancialExposurePaise += record.financialExposurePaise;

    if (record.status === 'AUTO_RECONCILED') {
      autoReconciledCount++;
      totalAutoReconciled++;
      matchedAmountPaise += grossPaise;
    } else if (record.status === 'PENDING_REVIEW' || record.status === 'MANUALLY_APPROVED') {
      manualReviewCount++;
    } else {
      exceptionCount++;
    }

    if (!gt) return;

    // Check exception classification match
    if (record.exceptionType === gt.expectedExceptionType) {
      correctExceptionCount++;
    }

    const hasProposedPair =
      record.matchedSettlement !== null && record.matchedBankTransaction !== null;

    if (hasProposedPair) {
      totalProposedPairs++;
    }

    const isSettlementCorrect =
      record.matchedSettlement?.settlementId === gt.expectedSettlementId;
    const isBankCorrect =
      record.matchedBankTransaction?.bankTransactionId === gt.expectedBankTransactionId;
    const isPairCorrect = hasProposedPair && isSettlementCorrect && isBankCorrect;

    if (isPairCorrect) {
      correctProposedPairs++;
    }

    // Evaluate Auto-Resolution Precision & Recall
    if (record.status === 'AUTO_RECONCILED') {
      if (gt.expectedOutcome === 'auto_reconciled' && isPairCorrect) {
        correctAutoReconciled++;
      } else {
        // Unsafe Auto-Match (Dangerous False Positive with monetary exposure)
        falsePositiveExposurePaise += grossPaise;
        errors.push({
          paymentId: record.payment.paymentId,
          grossAmountPaise: grossPaise,
          predictedOutcome: record.status,
          expectedOutcome: gt.expectedOutcome,
          predictedSettlementId: record.matchedSettlement?.settlementId || null,
          expectedSettlementId: gt.expectedSettlementId,
          predictedBankTransactionId: record.matchedBankTransaction?.bankTransactionId || null,
          expectedBankTransactionId: gt.expectedBankTransactionId,
          predictedExceptionType: record.exceptionType,
          expectedExceptionType: gt.expectedExceptionType,
          confidence: record.confidence,
          errorClassification: 'FALSE_POSITIVE',
          explanation: `Unsafe auto-reconciliation: Expected ${gt.expectedOutcome} (${gt.scenarioDescription}) but engine automatically reconciled.`,
          monetaryExposurePaise: grossPaise,
        });
      }
    }

    // Evaluate Review-Routing Accuracy
    if (gt.expectedOutcome === 'manual_review') {
      if (record.status === 'PENDING_REVIEW' || record.status === 'MANUALLY_APPROVED') {
        correctReviewRouted++;
      } else if (record.status === 'UNMATCHED_EXCEPTION') {
        errors.push({
          paymentId: record.payment.paymentId,
          grossAmountPaise: grossPaise,
          predictedOutcome: record.status,
          expectedOutcome: gt.expectedOutcome,
          predictedSettlementId: record.matchedSettlement?.settlementId || null,
          expectedSettlementId: gt.expectedSettlementId,
          predictedBankTransactionId: record.matchedBankTransaction?.bankTransactionId || null,
          expectedBankTransactionId: gt.expectedBankTransactionId,
          predictedExceptionType: record.exceptionType,
          expectedExceptionType: gt.expectedExceptionType,
          confidence: record.confidence,
          errorClassification: 'FALSE_NEGATIVE',
          explanation: `Review routing failure: Expected manual_review but record dropped into unmatched_exception.`,
          monetaryExposurePaise: grossPaise,
        });
      }
    }

    // Evaluate missed auto-reconcile matches (False Negatives for Auto-Resolution)
    if (gt.expectedOutcome === 'auto_reconciled' && record.status !== 'AUTO_RECONCILED') {
      errors.push({
        paymentId: record.payment.paymentId,
        grossAmountPaise: grossPaise,
        predictedOutcome: record.status,
        expectedOutcome: gt.expectedOutcome,
        predictedSettlementId: record.matchedSettlement?.settlementId || null,
        expectedSettlementId: gt.expectedSettlementId,
        predictedBankTransactionId: record.matchedBankTransaction?.bankTransactionId || null,
        expectedBankTransactionId: gt.expectedBankTransactionId,
        predictedExceptionType: record.exceptionType,
        expectedExceptionType: gt.expectedExceptionType,
        confidence: record.confidence,
        errorClassification: 'FALSE_NEGATIVE',
        explanation: `Missed auto-resolution: Valid safe match left in ${record.status}.`,
        monetaryExposurePaise: grossPaise,
      });
    }
  });

  const totalRecords = records.length;

  // 1. Proposed-Pair Precision & Recall
  const proposedPairPrecision =
    totalProposedPairs > 0 ? correctProposedPairs / totalProposedPairs : 1.0;
  const proposedPairRecall =
    totalExpectedPairs > 0 ? correctProposedPairs / totalExpectedPairs : 1.0;

  // 2. Auto-Resolution Precision & Recall
  const autoResolutionPrecision =
    totalAutoReconciled > 0 ? correctAutoReconciled / totalAutoReconciled : 1.0;
  const autoResolutionRecall =
    totalExpectedAutoSafe > 0 ? correctAutoReconciled / totalExpectedAutoSafe : 1.0;

  // 3. Review-Routing Accuracy
  const reviewRoutingAccuracy =
    totalExpectedReview > 0 ? correctReviewRouted / totalExpectedReview : 1.0;

  // 4. Exception Classification Accuracy
  const exceptionDetectionAccuracy =
    totalRecords > 0 ? correctExceptionCount / totalRecords : 0;

  // Rates & Coverage
  const autoReconciliationRate = totalRecords > 0 ? autoReconciledCount / totalRecords : 0;
  const manualReviewRate = totalRecords > 0 ? manualReviewCount / totalRecords : 0;
  const amountCoverageRate =
    totalGrossAmountPaise > 0 ? matchedAmountPaise / totalGrossAmountPaise : 0;

  // Harmonic mean of auto-resolution precision & recall
  const f1Score =
    autoResolutionPrecision + autoResolutionRecall > 0
      ? (2 * autoResolutionPrecision * autoResolutionRecall) /
        (autoResolutionPrecision + autoResolutionRecall)
      : 0;

  return {
    totalRecordsProcessed: totalRecords,

    // Separated Honest Metrics
    proposedPairPrecision,
    proposedPairRecall,
    totalProposedPairs,
    correctProposedPairs,
    totalExpectedPairs,

    autoResolutionPrecision,
    autoResolutionRecall,
    totalAutoReconciled,
    correctAutoReconciled,
    totalExpectedAutoSafe,

    reviewRoutingAccuracy,
    totalExpectedReview,
    correctReviewRouted,

    exceptionDetectionAccuracy,
    correctExceptionCount,

    falsePositiveExposurePaise,
    totalGrossAmountPaise,
    matchedAmountPaise,
    amountCoverageRate,
    totalFinancialExposurePaise,

    // Aliases
    precision: proposedPairPrecision,
    recall: proposedPairRecall,
    f1Score,
    autoReconciledCount,
    autoReconciliationRate,
    manualReviewCount,
    manualReviewRate,
    exceptionCount,

    processingDurationMs,
    errors,
  };
}

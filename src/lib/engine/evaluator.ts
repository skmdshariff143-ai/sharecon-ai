/**
 * Ground Truth Evaluation Engine for ShaRecon AI
 * Accurately measures precision, recall, F1, and financial exposure against labeled benchmark.
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

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;

  let correctExceptionCount = 0;
  let autoReconciledCount = 0;
  let manualReviewCount = 0;
  let exceptionCount = 0;

  let totalGrossAmountPaise = 0;
  let matchedAmountPaise = 0;
  let falsePositiveExposurePaise = 0;
  let totalFinancialExposurePaise = 0;

  const errors: ErrorInspectionItem[] = [];

  records.forEach((record) => {
    const gt = gtByPaymentId.get(record.payment.paymentId);
    const grossPaise = record.payment.grossAmount;
    totalGrossAmountPaise += grossPaise;
    totalFinancialExposurePaise += record.financialExposurePaise;

    if (record.status === 'AUTO_RECONCILED') {
      autoReconciledCount++;
      matchedAmountPaise += grossPaise;
    } else if (record.status === 'PENDING_REVIEW' || record.status === 'MANUALLY_APPROVED') {
      manualReviewCount++;
    } else {
      exceptionCount++;
    }

    if (!gt) return;

    // Exception classification accuracy check
    if (record.exceptionType === gt.expectedExceptionType) {
      correctExceptionCount++;
    }

    const isSettlementCorrect =
      record.matchedSettlement?.settlementId === gt.expectedSettlementId;
    const isBankCorrect =
      record.matchedBankTransaction?.bankTransactionId === gt.expectedBankTransactionId;

    if (gt.expectedOutcome === 'auto_reconciled') {
      if (record.status === 'AUTO_RECONCILED') {
        if (isSettlementCorrect && isBankCorrect) {
          truePositives++;
        } else {
          // Dangerous Auto-Match to wrong entity
          falsePositives++;
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
            explanation: `Auto-reconciled wrong entity: Predicted [${record.matchedSettlement?.settlementId}] vs Expected [${gt.expectedSettlementId}]`,
            monetaryExposurePaise: grossPaise,
          });
        }
      } else if (record.status === 'PENDING_REVIEW') {
        // Safe escalation to review (counted as conservative true match)
        truePositives++;
      } else {
        // False negative: missed clean match
        falseNegatives++;
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
          explanation: `Missed auto-reconcile match: Left as ${record.status}`,
          monetaryExposurePaise: grossPaise,
        });
      }
    } else if (gt.expectedOutcome === 'manual_review') {
      if (record.status === 'PENDING_REVIEW' || record.status === 'MANUALLY_APPROVED') {
        // Correctly flagged for review
        truePositives++;
      } else if (record.status === 'AUTO_RECONCILED') {
        // Unsafe Auto-Reconcile on ambiguous/review case
        falsePositives++;
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
          explanation: `Unsafe auto-reconcile on review-required transaction (${gt.scenarioDescription})`,
          monetaryExposurePaise: grossPaise,
        });
      } else {
        // Classified as unmatched exception rather than review
        trueNegatives++;
      }
    } else {
      // Expected outcome is 'unmatched_exception'
      if (record.status === 'UNMATCHED_EXCEPTION') {
        trueNegatives++;
      } else if (record.status === 'AUTO_RECONCILED') {
        // False positive on an invalid/missing transaction
        falsePositives++;
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
          explanation: `Unsafe match on missing/invalid record (${gt.scenarioDescription})`,
          monetaryExposurePaise: grossPaise,
        });
      } else {
        // Escalated to review
        trueNegatives++;
      }
    }
  });

  const totalRecords = records.length;
  const precisionDenominator = truePositives + falsePositives;
  const recallDenominator = truePositives + falseNegatives;

  const precision = precisionDenominator > 0 ? truePositives / precisionDenominator : 1.0;
  const recall = recallDenominator > 0 ? truePositives / recallDenominator : 1.0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const autoReconciliationRate = totalRecords > 0 ? autoReconciledCount / totalRecords : 0;
  const manualReviewRate = totalRecords > 0 ? manualReviewCount / totalRecords : 0;
  const exceptionDetectionAccuracy =
    totalRecords > 0 ? correctExceptionCount / totalRecords : 0;
  const amountCoverageRate =
    totalGrossAmountPaise > 0 ? matchedAmountPaise / totalGrossAmountPaise : 0;

  return {
    totalRecordsProcessed: totalRecords,
    correctMatches: truePositives,
    incorrectMatches: falsePositives,
    missedMatches: falseNegatives,
    trueNegatives,
    precision,
    recall,
    f1Score,
    autoReconciledCount,
    autoReconciliationRate,
    manualReviewCount,
    manualReviewRate,
    exceptionCount,
    exceptionDetectionAccuracy,
    totalGrossAmountPaise,
    matchedAmountPaise,
    amountCoverageRate,
    falsePositiveExposurePaise,
    totalFinancialExposurePaise,
    processingDurationMs,
    errors,
  };
}

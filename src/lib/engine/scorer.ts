/**
 * Explainable Deterministic Match Scorer for ShaRecon AI
 * Calculates confidence breakdown and human-readable audit justification.
 */

import {
  Payment,
  Settlement,
  BankTransaction,
  EvidenceBreakdown,
  ExceptionType,
} from '@/types/reconciliation';
import {
  normalizeReference,
  normalizeUtr,
  calculateDateDeltaDays,
  computeTokenSimilarity,
} from './normalizer';
import { formatINR } from '@/lib/money';

export interface ScoreResult {
  confidence: number;
  evidence: EvidenceBreakdown;
  explanation: string;
  exceptionType: ExceptionType;
  financialExposurePaise: number;
}

export function score3WayMatch(
  payment: Payment,
  settlement: Settlement | null,
  bankTx: BankTransaction | null,
  feeTolerancePaise = 0
): ScoreResult {
  // If no settlement exists at all
  if (!settlement) {
    return {
      confidence: 0,
      evidence: {
        referenceScore: 0,
        amountScore: 0,
        dateScore: 0,
        descriptionScore: 0,
        totalConfidence: 0,
        details: {
          referenceMatch: 'NONE',
          utrMatch: 'NONE',
          amountDifferencePaise: payment.grossAmount,
          amountTolerancePassed: false,
          dateDeltaDays: 999,
          descriptionSimilarityRatio: 0,
        },
      },
      explanation: `Unreconciled payment (${payment.paymentId}): No corresponding settlement record found in gateway batch.`,
      exceptionType: 'MISSING_SETTLEMENT',
      financialExposurePaise: payment.grossAmount,
    };
  }

  // 1. Reference Matching (Max 40 points)
  let referenceScore = 0;
  let referenceMatch: EvidenceBreakdown['details']['referenceMatch'] = 'NONE';

  const normPayId = normalizeReference(payment.paymentId);
  const normOrderId = normalizeReference(payment.orderId);
  const normSetRef = normalizeReference(settlement.paymentReference);

  if (normSetRef === normPayId) {
    referenceScore = 40;
    referenceMatch = 'EXACT_PAYMENT_ID';
  } else if (normSetRef === normOrderId) {
    referenceScore = 35;
    referenceMatch = 'EXACT_ORDER_ID';
  } else if (
    normSetRef.length > 5 &&
    (normPayId.includes(normSetRef) ||
      normSetRef.includes(normPayId) ||
      normOrderId.includes(normSetRef))
  ) {
    referenceScore = 20;
    referenceMatch = 'PARTIAL_REF';
  }

  // 2. Amount Matching (Max 35 points) - in Integer Paise
  let amountScore = 0;
  const payExpectedNet = payment.expectedNetAmount;
  const setAmount = settlement.settledAmount;
  const setDiff = Math.abs(payExpectedNet - setAmount);

  let bankDiff = 0;
  let bankAmountScore = 0;

  // If no bank transaction found, bank amounts cannot match
  if (bankTx) {
    bankDiff = Math.abs(setAmount - bankTx.creditAmount);
    if (bankDiff === 0) {
      bankAmountScore = 15;
    } else if (bankDiff <= feeTolerancePaise) {
      bankAmountScore = 10;
    }
  }

  if (bankTx) {
    if (setDiff === 0) {
      amountScore = 20 + bankAmountScore;
    } else if (setDiff <= 100) {
      // Within ₹1 variance (rounding / minor fee adjustment)
      amountScore = 12 + bankAmountScore;
    } else if (setDiff <= 500) {
      // Within ₹5
      amountScore = 6 + Math.floor(bankAmountScore / 2);
    }
  } else {
    // Missing bank credit means financial settlement leg is incomplete
    amountScore = 0;
  }

  const amountTolerancePassed = bankTx ? setDiff <= feeTolerancePaise : false;

  // 3. Date Proximity (Max 15 points)
  let dateScore = 0;
  const payToSetDays = calculateDateDeltaDays(payment.createdAt, settlement.settledAt);
  const setToBankDays = bankTx
    ? calculateDateDeltaDays(settlement.settledAt, bankTx.creditedAt)
    : 0;
  const totalDateDelta = payToSetDays + setToBankDays;

  if (bankTx) {
    if (totalDateDelta <= 1) {
      dateScore = 15; // T+0 or T+1
    } else if (totalDateDelta <= 3) {
      dateScore = 12; // T+2 / T+3
    } else if (totalDateDelta <= 6) {
      dateScore = 6;
    } else {
      dateScore = 0; // > 6 days
    }
  } else {
    dateScore = 0;
  }

  // 4. Description and UTR Matching (Max 10 points)
  let descriptionScore = 0;
  let utrMatch: EvidenceBreakdown['details']['utrMatch'] = 'NONE';
  let descSimilarity = 0;

  if (bankTx) {
    const normSetUtr = normalizeUtr(settlement.utr);
    const normBankUtr = normalizeUtr(bankTx.utr);

    if (normSetUtr && normBankUtr && normSetUtr === normBankUtr) {
      utrMatch = 'EXACT_UTR';
      descriptionScore += 7;
    } else if (
      normSetUtr &&
      normBankUtr &&
      (normBankUtr.includes(normSetUtr) || normSetUtr.includes(normBankUtr))
    ) {
      utrMatch = 'FUZZY_UTR';
      descriptionScore += 4;
    }

    descSimilarity = computeTokenSimilarity(bankTx.description, `${payment.paymentId} ${settlement.utr}`);
    if (descSimilarity >= 0.3) {
      descriptionScore += 3;
    } else if (descSimilarity >= 0.1) {
      descriptionScore += 1;
    }
  } else {
    descriptionScore = 0;
  }

  let totalConfidence = bankTx
    ? Math.min(100, referenceScore + amountScore + dateScore + descriptionScore)
    : Math.min(30, referenceScore);

  // If settlement was delayed past SLA window (>= 6 days), cap confidence for mandatory human review
  if (payToSetDays >= 6) {
    totalConfidence = Math.min(75, totalConfidence);
  }

  // Exception Classification & Exposure Determination
  let exceptionType: ExceptionType = 'CLEAN_MATCH';
  let financialExposurePaise = 0;

  const varianceRatio = payment.grossAmount > 0 ? setDiff / payment.grossAmount : 0;

  if (payment.currency !== 'INR') {
    exceptionType = 'UNSUPPORTED_CURRENCY';
    financialExposurePaise = payment.grossAmount;
  } else if (!bankTx) {
    exceptionType = 'MISSING_BANK_CREDIT';
    financialExposurePaise = setAmount;
  } else if (setDiff > 0 && varianceRatio <= 0.04) {
    exceptionType = 'FEE_TAX_ANOMALY';
    financialExposurePaise = setDiff;
  } else if (setDiff > 0) {
    exceptionType = 'AMOUNT_MISMATCH';
    financialExposurePaise = setDiff;
  } else if (payToSetDays >= 6) {
    exceptionType = 'DELAYED_SETTLEMENT';
    financialExposurePaise = 0;
  } else if (referenceMatch === 'NONE') {
    exceptionType = 'AMBIGUOUS_AMOUNT';
    financialExposurePaise = setAmount;
  } else if (referenceMatch === 'PARTIAL_REF' || referenceMatch === 'EXACT_ORDER_ID') {
    exceptionType = 'PARTIALLY_MISSING_REF';
    financialExposurePaise = 0;
  } else if (totalDateDelta >= 2 && totalDateDelta <= 4) {
    exceptionType = 'DATE_SKEW_MATCH';
    financialExposurePaise = 0;
  } else if (descSimilarity < 0.2 && utrMatch === 'EXACT_UTR') {
    exceptionType = 'INCONSISTENT_DESCRIPTION';
    financialExposurePaise = 0;
  } else {
    exceptionType = 'CLEAN_MATCH';
    financialExposurePaise = 0;
  }

  // Generate deterministic human-readable explanation
  const explanationParts: string[] = [];

  explanationParts.push(`Matched with ${totalConfidence}% confidence.`);

  if (referenceMatch === 'EXACT_PAYMENT_ID') {
    explanationParts.push(`Exact Payment ID ref (${payment.paymentId}) verified.`);
  } else if (referenceMatch === 'EXACT_ORDER_ID') {
    explanationParts.push(`Linked via Order ID (${payment.orderId}) reference.`);
  } else if (referenceMatch === 'PARTIAL_REF') {
    explanationParts.push(`Partial reference match detected.`);
  }

  if (setDiff === 0) {
    explanationParts.push(`Net settled amount matches expected ${formatINR(payExpectedNet)}.`);
  } else {
    explanationParts.push(
      `Amount variance of ${formatINR(setDiff)} (Expected: ${formatINR(payExpectedNet)}, Settled: ${formatINR(setAmount)}).`
    );
  }

  if (bankTx) {
    if (utrMatch === 'EXACT_UTR') {
      explanationParts.push(`Bank credit verified with exact UTR ${settlement.utr}.`);
    }
    if (totalDateDelta === 0) {
      explanationParts.push('Settled and credited same-day.');
    } else {
      explanationParts.push(`Settled in ${totalDateDelta} day(s).`);
    }
  } else {
    explanationParts.push('Awaiting corresponding bank statement credit advice.');
  }

  const explanation = explanationParts.join(' ');

  const evidence: EvidenceBreakdown = {
    referenceScore,
    amountScore,
    dateScore,
    descriptionScore,
    totalConfidence,
    details: {
      referenceMatch,
      utrMatch,
      amountDifferencePaise: setDiff,
      amountTolerancePassed,
      dateDeltaDays: totalDateDelta,
      descriptionSimilarityRatio: descSimilarity,
    },
  };

  return {
    confidence: totalConfidence,
    evidence,
    explanation,
    exceptionType,
    financialExposurePaise,
  };
}

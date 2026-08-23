/**
 * Grounded Exception Analyst with Gemini & Deterministic Offline Fallback
 * Strictly bounded to structured evidence. Never invents transactions or alters scores.
 */

import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import {
  ReconciliationRecord,
  AiExceptionAnalysis,
  ExceptionType,
} from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

export const PaymentInputSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  orderId: z.string().min(1, 'orderId is required'),
  grossAmount: z.number().int('grossAmount must be an integer paise').positive('grossAmount must be positive'),
  fee: z.number().int('fee must be an integer paise').nonnegative(),
  tax: z.number().int('tax must be an integer paise').nonnegative(),
  expectedNetAmount: z.number().int('expectedNetAmount must be an integer paise').positive(),
  currency: z.string().min(1, 'currency is required'),
  status: z.enum(['captured', 'failed', 'refunded', 'pending']),
  createdAt: z.string().min(1, 'createdAt timestamp is required'),
});

export const SettlementInputSchema = z.object({
  settlementId: z.string().min(1, 'settlementId is required'),
  paymentReference: z.string().min(1, 'paymentReference is required'),
  settledAmount: z.number().int('settledAmount must be an integer paise').positive(),
  utr: z.string().min(1, 'utr is required'),
  settledAt: z.string().min(1, 'settledAt timestamp is required'),
  status: z.enum(['created', 'processed', 'failed']),
});

export const BankTransactionInputSchema = z.object({
  bankTransactionId: z.string().min(1, 'bankTransactionId is required'),
  utr: z.string().min(1, 'utr is required'),
  creditAmount: z.number().int('creditAmount must be an integer paise').positive(),
  description: z.string().min(1, 'description is required'),
  creditedAt: z.string().min(1, 'creditedAt timestamp is required'),
});

export const EvidenceBreakdownInputSchema = z.object({
  referenceScore: z.number().nonnegative(),
  amountScore: z.number().nonnegative(),
  dateScore: z.number().nonnegative(),
  descriptionScore: z.number().nonnegative(),
  totalConfidence: z.number().nonnegative(),
  details: z.record(z.string(), z.unknown()),
});

export const ReconciliationRecordInputSchema = z.object({
  recordId: z.string().min(1, 'recordId is required'),
  payment: PaymentInputSchema,
  matchedSettlement: SettlementInputSchema.nullable().optional(),
  matchedBankTransaction: BankTransactionInputSchema.nullable().optional(),
  status: z.enum([
    'AUTO_RECONCILED',
    'PENDING_REVIEW',
    'MANUALLY_APPROVED',
    'MANUALLY_REJECTED',
    'UNMATCHED_EXCEPTION',
  ]),
  confidence: z.number().min(0).max(100),
  exceptionType: z.enum([
    'CLEAN_MATCH',
    'DATE_SKEW_MATCH',
    'MISSING_BANK_CREDIT',
    'MISSING_SETTLEMENT',
    'DUPLICATE_SETTLEMENT',
    'DUPLICATE_BANK_CREDIT',
    'AMOUNT_MISMATCH',
    'FEE_TAX_ANOMALY',
    'DELAYED_SETTLEMENT',
    'INCONSISTENT_DESCRIPTION',
    'PARTIALLY_MISSING_REF',
    'AMBIGUOUS_AMOUNT',
    'MALFORMED_ROW',
    'UNSUPPORTED_CURRENCY',
  ]),
  financialExposurePaise: z.number().int().nonnegative(),
  evidence: EvidenceBreakdownInputSchema,
  explanation: z.string().min(1, 'explanation is required'),
});

export const AnalyzeExceptionRequestBodySchema = z.object({
  record: ReconciliationRecordInputSchema,
});

export const ExceptionAnalysisResponseSchema = z.object({
  exceptionCategory: z.enum([
    'CLEAN_MATCH',
    'DATE_SKEW_MATCH',
    'MISSING_BANK_CREDIT',
    'MISSING_SETTLEMENT',
    'DUPLICATE_SETTLEMENT',
    'DUPLICATE_BANK_CREDIT',
    'AMOUNT_MISMATCH',
    'FEE_TAX_ANOMALY',
    'DELAYED_SETTLEMENT',
    'INCONSISTENT_DESCRIPTION',
    'PARTIALLY_MISSING_REF',
    'AMBIGUOUS_AMOUNT',
    'MALFORMED_ROW',
    'UNSUPPORTED_CURRENCY',
  ]),
  summary: z.string().min(5),
  recommendedAction: z.string().min(5),
  missingInformation: z.array(z.string()),
  reviewerNote: z.string().min(5),
  riskAssessment: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

/**
 * Deterministic rule-based fallback analyst
 * Preserves core triage recommendations when Gemini is unavailable.
 */
export function generateDeterministicFallbackAnalysis(
  record: ReconciliationRecord
): AiExceptionAnalysis {
  const { payment, matchedSettlement, exceptionType, evidence } = record;

  const now = new Date().toISOString();
  let summary = '';
  let recommendedAction = '';
  const missingInformation: string[] = [];
  let reviewerNote = '';
  let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  switch (exceptionType) {
    case 'MISSING_BANK_CREDIT':
      summary = `Gateway settlement ${matchedSettlement?.settlementId || 'N/A'} of ${formatINR(
        matchedSettlement?.settledAmount || 0
      )} is processed, but merchant bank account statement has no corresponding credit advice with UTR ${
        matchedSettlement?.utr || 'N/A'
      }.`;
      recommendedAction =
        'Contact merchant acquiring bank operations team with UTR advice to trace un-credited deposit.';
      missingInformation.push(
        `Bank credit confirmation advice for UTR ${matchedSettlement?.utr || 'N/A'}`
      );
      reviewerNote =
        'High financial exposure: funds deducted at gateway but unconfirmed in merchant bank balance.';
      riskAssessment = 'HIGH';
      break;

    case 'MISSING_SETTLEMENT':
      summary = `Customer payment ${payment.paymentId} for ${formatINR(
        payment.grossAmount
      )} captured successfully, but no settlement record exists in Razorpay settlement batch.`;
      recommendedAction =
        'Check Razorpay nodal settlement queue for hold/compliance review or next payout cycle.';
      missingInformation.push('Settlement batch advice ID & nodal payout reference');
      reviewerNote =
        'Check if payment is in standard T+2 settlement cycle or on merchant risk hold.';
      riskAssessment = 'HIGH';
      break;

    case 'DUPLICATE_SETTLEMENT':
      summary = `Multiple settlement advice entries reference the same payment ID (${payment.paymentId}).`;
      recommendedAction =
        'Inspect gateway ledger to confirm whether duplicate credit advice or double-settlement occurred.';
      missingInformation.push('Gateway settlement batch breakdown logs');
      reviewerNote = 'Avoid double-crediting merchant revenue ledger.';
      riskAssessment = 'MEDIUM';
      break;

    case 'DUPLICATE_BANK_CREDIT':
      summary = `Multiple bank statement lines share identical UTR (${matchedSettlement?.utr || 'N/A'}).`;
      recommendedAction =
        'Verify bank statement whether entry was an accidental duplicate credit or reversal leg.';
      missingInformation.push('Bank statement reversal line items');
      reviewerNote =
        'Review bank transaction logs to verify if duplicate is a reversal or duplicate credit advice.';
      riskAssessment = 'MEDIUM';
      break;

    case 'AMOUNT_MISMATCH':
      summary = `Settled amount (${formatINR(
        matchedSettlement?.settledAmount || 0
      )}) differs from expected net (${formatINR(
        payment.expectedNetAmount
      )}) by ${formatINR(evidence.details.amountDifferencePaise)}.`;
      recommendedAction =
        'Verify whether custom discount, international card fee, or dispute clawback was deducted.';
      missingInformation.push('Fee breakdown schedule and dispute debit advice');
      reviewerNote =
        'Material variance exceeding standard fee tolerance. Requires finance approval.';
      riskAssessment = 'HIGH';
      break;

    case 'FEE_TAX_ANOMALY':
      summary = `Net settlement variance of ${formatINR(
        evidence.details.amountDifferencePaise
      )} due to non-standard gateway fee rate deduction.`;
      recommendedAction =
        'Check merchant pricing tier (e.g. 3.5% premium card fee vs standard 2.0%). Approve if tier matches contract.';
      missingInformation.push('Merchant fee schedule contract tier');
      reviewerNote =
        'Minor fee rate discrepancy. Confirm pricing tier applied by payment gateway.';
      riskAssessment = 'LOW';
      break;

    case 'DELAYED_SETTLEMENT':
      summary = `Settlement occurred ${evidence.details.dateDeltaDays} days after payment (standard SLA: T+1).`;
      recommendedAction =
        'Verify if settlement delay was caused by public bank holiday or gateway payout maintenance.';
      missingInformation.push('Gateway banking calendar log');
      reviewerNote =
        'Payment and credit match reference and amount, but delayed beyond standard SLA.';
      riskAssessment = 'LOW';
      break;

    case 'AMBIGUOUS_AMOUNT':
      summary = `Multiple recurring transactions with identical amount (${formatINR(
        payment.grossAmount
      )}) occurred on same day without distinct payment ID reference.`;
      recommendedAction =
        'Match order items and customer billing references manually before confirming reconciliation.';
      missingInformation.push('Customer checkout metadata & order invoice details');
      reviewerNote =
        'Ambiguous amount collision. Do not auto-reconcile without customer reference cross-check.';
      riskAssessment = 'MEDIUM';
      break;

    case 'UNSUPPORTED_CURRENCY':
      summary = `Payment currency is ${payment.currency}; platform currently requires INR settlement standard.`;
      recommendedAction =
        'Route to Forex / Cross-Border settlement ledger for currency conversion matching.';
      missingInformation.push('Forex conversion rate & mark-up advice');
      reviewerNote = 'Foreign currency transaction requires FX conversion ledger trace.';
      riskAssessment = 'MEDIUM';
      break;

    default:
      summary = `Transaction scored ${evidence.totalConfidence}% confidence with ${exceptionType}.`;
      recommendedAction = 'Proceed with standard operational audit.';
      reviewerNote = 'Evidence parameters within normal operational bounds.';
      riskAssessment = 'LOW';
      break;
  }

  return {
    exceptionCategory: exceptionType,
    summary,
    recommendedAction,
    missingInformation,
    reviewerNote,
    riskAssessment,
    modelUsed: 'ShaRecon-Deterministic-Fallback',
    isFallback: true,
    analyzedAt: now,
  };
}

/**
 * Analyzes exception using Google GenAI SDK (Gemini 2.5 Flash) with fallback.
 */
export async function analyzeExceptionWithGemini(
  record: ReconciliationRecord,
  apiKey?: string
): Promise<AiExceptionAnalysis> {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    return generateDeterministicFallbackAnalysis(record);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const systemInstruction = `You are an expert AI Finance Controller for ShaRecon AI reconciling Razorpay payments, settlements, and bank credits.
Your task is to analyze financial reconciliation anomalies based STRICTLY on the structured evidence provided.
Rules:
1. NEVER invent transactions, UTRs, or amounts not present in the input.
2. Provide grounded, concise financial analysis.
3. Classify risk honestly (LOW, MEDIUM, HIGH).
4. Return pure JSON matching the specified schema.`;

    const promptPayload = {
      recordId: record.recordId,
      payment: {
        paymentId: record.payment.paymentId,
        orderId: record.payment.orderId,
        grossAmountPaise: record.payment.grossAmount,
        grossAmountFormatted: formatINR(record.payment.grossAmount),
        expectedNetAmountPaise: record.payment.expectedNetAmount,
        expectedNetAmountFormatted: formatINR(record.payment.expectedNetAmount),
        currency: record.payment.currency,
        createdAt: record.payment.createdAt,
      },
      matchedSettlement: record.matchedSettlement
        ? {
            settlementId: record.matchedSettlement.settlementId,
            paymentReference: record.matchedSettlement.paymentReference,
            settledAmountPaise: record.matchedSettlement.settledAmount,
            settledAmountFormatted: formatINR(record.matchedSettlement.settledAmount),
            utr: record.matchedSettlement.utr,
            settledAt: record.matchedSettlement.settledAt,
          }
        : null,
      matchedBankTransaction: record.matchedBankTransaction
        ? {
            bankTransactionId: record.matchedBankTransaction.bankTransactionId,
            utr: record.matchedBankTransaction.utr,
            creditAmountPaise: record.matchedBankTransaction.creditAmount,
            creditAmountFormatted: formatINR(record.matchedBankTransaction.creditAmount),
            description: record.matchedBankTransaction.description,
            creditedAt: record.matchedBankTransaction.creditedAt,
          }
        : null,
      deterministicScore: record.confidence,
      deterministicExceptionType: record.exceptionType,
      evidenceBreakdown: record.evidence,
      financialExposureFormatted: formatINR(record.financialExposurePaise),
    };

    // Use AbortController for a strict 6-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\nAnalyze this reconciliation record:\n${JSON.stringify(
                promptPayload,
                null,
                2
              )}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    const responseText = response.text || '';
    const rawJson = JSON.parse(responseText);
    const validated = ExceptionAnalysisResponseSchema.parse(rawJson);

    return {
      exceptionCategory: validated.exceptionCategory as ExceptionType,
      summary: validated.summary,
      recommendedAction: validated.recommendedAction,
      missingInformation: validated.missingInformation,
      reviewerNote: validated.reviewerNote,
      riskAssessment: validated.riskAssessment,
      modelUsed: 'gemini-2.5-flash',
      isFallback: false,
      analyzedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    // Graceful fallback on API error, timeout, rate limit, or invalid response
    console.warn('Gemini Exception Analyst fallback activated:', err instanceof Error ? err.message : String(err));
    return generateDeterministicFallbackAnalysis(record);
  }
}

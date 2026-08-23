import { describe, it, expect } from 'vitest';
import {
  generateDeterministicFallbackAnalysis,
  ExceptionAnalysisResponseSchema,
  AnalyzeExceptionRequestBodySchema,
} from '@/lib/ai/analyst';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';

describe('AI Exception Analyst & Deterministic Fallback', () => {
  it('generates schema-compliant fallback analysis for missing bank credit', () => {
    const dataset = generateSyntheticDataset(42);
    const batch = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    const missingBankRecord = batch.records.find(
      (r) => r.exceptionType === 'MISSING_BANK_CREDIT'
    );
    expect(missingBankRecord).toBeDefined();

    if (missingBankRecord) {
      const analysis = generateDeterministicFallbackAnalysis(missingBankRecord);

      expect(analysis.isFallback).toBe(true);
      expect(analysis.modelUsed).toBe('ShaRecon-Deterministic-Fallback');
      expect(analysis.riskAssessment).toBe('HIGH');
      expect(analysis.summary).toContain('Gateway settlement');
      expect(analysis.recommendedAction).toContain('merchant acquiring bank');
      expect(analysis.missingInformation.length).toBeGreaterThan(0);

      // Verify it adheres to the Zod schema
      const validated = ExceptionAnalysisResponseSchema.parse(analysis);
      expect(validated.exceptionCategory).toBe('MISSING_BANK_CREDIT');
    }
  });

  it('generates appropriate risk assessment for fee anomalies', () => {
    const dataset = generateSyntheticDataset(42);
    const batch = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );

    const feeAnomalyRecord = batch.records.find(
      (r) => r.exceptionType === 'FEE_TAX_ANOMALY'
    );
    expect(feeAnomalyRecord).toBeDefined();

    if (feeAnomalyRecord) {
      const analysis = generateDeterministicFallbackAnalysis(feeAnomalyRecord);
      expect(analysis.riskAssessment).toBe('LOW');
      expect(analysis.summary).toContain('fee');
      expect(analysis.recommendedAction).toContain('pricing tier');
    }
  });

  it('rejects malformed API input payloads with strict Zod validation', () => {
    // Missing payment
    const invalid1 = AnalyzeExceptionRequestBodySchema.safeParse({
      record: {
        recordId: 'rec_123',
      },
    });
    expect(invalid1.success).toBe(false);

    // Negative grossAmount (invalid paise)
    const invalid2 = AnalyzeExceptionRequestBodySchema.safeParse({
      record: {
        recordId: 'rec_123',
        status: 'PENDING_REVIEW',
        confidence: 80,
        exceptionType: 'CLEAN_MATCH',
        financialExposurePaise: 0,
        evidence: {
          referenceScore: 40,
          amountScore: 35,
          dateScore: 15,
          descriptionScore: 10,
          totalConfidence: 100,
          details: {},
        },
        explanation: 'Valid match',
        payment: {
          paymentId: 'pay_123',
          orderId: 'order_123',
          grossAmount: -500, // Invalid: must be positive
          fee: 10,
          tax: 2,
          expectedNetAmount: 488,
          currency: 'INR',
          status: 'captured',
          createdAt: '2026-03-01',
        },
      },
    });
    expect(invalid2.success).toBe(false);

    // Missing evidence details
    const invalid3 = AnalyzeExceptionRequestBodySchema.safeParse({
      record: {
        recordId: 'rec_123',
        status: 'PENDING_REVIEW',
        confidence: 80,
        exceptionType: 'CLEAN_MATCH',
        financialExposurePaise: 0,
        payment: {
          paymentId: 'pay_123',
          orderId: 'order_123',
          grossAmount: 5000,
          fee: 100,
          tax: 18,
          expectedNetAmount: 4882,
          currency: 'INR',
          status: 'captured',
          createdAt: '2026-03-01',
        },
        // missing evidence
        explanation: 'Valid match',
      },
    });
    expect(invalid3.success).toBe(false);
  });
});

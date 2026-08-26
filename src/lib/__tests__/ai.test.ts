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
  });

  describe('Multi-Model LLM Fallback Chain & Circuit Breaker', () => {
    it('routes to secondary model when primary model fails', async () => {
      const dataset = generateSyntheticDataset(42);
      const batch = reconcileBatch(
        dataset.payments,
        dataset.settlements,
        dataset.bankTransactions,
        DEFAULT_ENGINE_CONFIG
      );
      const record = batch.records[0];

      const { analyzeExceptionWithMultiModelRouting, AiModelCircuitBreaker } = await import('@/lib/ai/analyst');
      const testBreaker = new AiModelCircuitBreaker({ maxConsecutiveFailures: 3 });

      const customPrimaryCaller = async () => {
        throw new Error('Primary Gemini-2.5-flash timed out (504)');
      };

      const customSecondaryCaller = async () => {
        return {
          exceptionCategory: 'CLEAN_MATCH' as const,
          summary: 'Secondary model analysis from gemini-2.5-flash-lite',
          recommendedAction: 'Proceed with auto-settlement review',
          missingInformation: [],
          reviewerNote: 'Secondary LLM completed triage',
          riskAssessment: 'LOW' as const,
          modelUsed: 'gemini-2.5-flash-lite',
          isFallback: true,
          analyzedAt: new Date().toISOString(),
        };
      };

      const result = await analyzeExceptionWithMultiModelRouting(record, {
        circuitBreaker: testBreaker,
        customPrimaryCaller,
        customSecondaryCaller,
      });

      expect(result.modelUsed).toContain('gemini-2.5-flash-lite');
      expect(result.summary).toContain('Secondary model analysis');
      expect(testBreaker.getStats().consecutiveFailures).toBe(1);
    });

    it('falls back to deterministic rule-based analyst when all models fail', async () => {
      const dataset = generateSyntheticDataset(42);
      const batch = reconcileBatch(
        dataset.payments,
        dataset.settlements,
        dataset.bankTransactions,
        DEFAULT_ENGINE_CONFIG
      );
      const record = batch.records.find((r) => r.exceptionType === 'MISSING_BANK_CREDIT') || batch.records[0];

      const { analyzeExceptionWithMultiModelRouting, AiModelCircuitBreaker } = await import('@/lib/ai/analyst');
      const testBreaker = new AiModelCircuitBreaker({ maxConsecutiveFailures: 3 });

      const failingPrimary = async () => {
        throw new Error('Primary model unavailable');
      };
      const failingSecondary = async () => {
        throw new Error('Secondary model rate limited');
      };

      const result = await analyzeExceptionWithMultiModelRouting(record, {
        circuitBreaker: testBreaker,
        customPrimaryCaller: failingPrimary,
        customSecondaryCaller: failingSecondary,
      });

      expect(result.isFallback).toBe(true);
      expect(result.modelUsed).toBe('ShaRecon-Deterministic-Fallback');
      expect(result.riskAssessment).toBeDefined();
    });

    it('trips circuit breaker after N consecutive failures and bypasses primary', async () => {
      const dataset = generateSyntheticDataset(42);
      const batch = reconcileBatch(
        dataset.payments,
        dataset.settlements,
        dataset.bankTransactions,
        DEFAULT_ENGINE_CONFIG
      );
      const record = batch.records[0];

      const { analyzeExceptionWithMultiModelRouting, AiModelCircuitBreaker } = await import('@/lib/ai/analyst');
      const testBreaker = new AiModelCircuitBreaker({ maxConsecutiveFailures: 2, cooldownMs: 5000 });

      let primaryCalls = 0;
      let secondaryCalls = 0;

      const failingPrimary = async () => {
        primaryCalls++;
        throw new Error('Primary 500 internal server error');
      };
      const succeedingSecondary = async () => {
        secondaryCalls++;
        return {
          exceptionCategory: 'CLEAN_MATCH' as const,
          summary: 'Secondary analysis',
          recommendedAction: 'Verify',
          missingInformation: [],
          reviewerNote: 'OK',
          riskAssessment: 'LOW' as const,
          modelUsed: 'gemini-2.5-flash-lite',
          isFallback: true,
          analyzedAt: new Date().toISOString(),
        };
      };

      // Call 1: primary fails, secondary succeeds (failures: 1, breaker closed)
      await analyzeExceptionWithMultiModelRouting(record, {
        circuitBreaker: testBreaker,
        customPrimaryCaller: failingPrimary,
        customSecondaryCaller: succeedingSecondary,
      });
      expect(primaryCalls).toBe(1);
      expect(secondaryCalls).toBe(1);
      expect(testBreaker.isOpen()).toBe(false);

      // Call 2: primary fails, secondary succeeds (failures: 2, breaker trips OPEN)
      await analyzeExceptionWithMultiModelRouting(record, {
        circuitBreaker: testBreaker,
        customPrimaryCaller: failingPrimary,
        customSecondaryCaller: succeedingSecondary,
      });
      expect(primaryCalls).toBe(2);
      expect(secondaryCalls).toBe(2);
      expect(testBreaker.isOpen()).toBe(true);

      // Call 3: breaker is OPEN, primary is NOT called, routed immediately to secondary!
      await analyzeExceptionWithMultiModelRouting(record, {
        circuitBreaker: testBreaker,
        customPrimaryCaller: failingPrimary,
        customSecondaryCaller: succeedingSecondary,
      });
      expect(primaryCalls).toBe(2); // Not called!
      expect(secondaryCalls).toBe(3);
    });
  });

  it('rejects malformed API input payloads with strict Zod validation (continued)', () => {
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

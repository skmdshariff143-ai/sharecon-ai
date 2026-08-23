import { describe, it, expect } from 'vitest';
import {
  generateDeterministicFallbackAnalysis,
  ExceptionAnalysisResponseSchema,
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
});

import { describe, it, expect, vi, afterEach } from 'vitest';
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@google/genai', () => ({ GoogleGenAI: class { models = { generateContent }; } }));
import { analyzeExceptionWithMultiModelRouting, AiModelCircuitBreaker } from '../ai/analyst';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch } from '../engine/matcher';
const data = generateSyntheticDataset(42);
const record = reconcileBatch(data.payments, data.settlements, data.bankTransactions).records[0];
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Provider request resilience', () => {
  it('actually aborts both slow providers and returns deterministic fallback', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    generateContent.mockImplementation(({ config }) => new Promise((_, reject) => {
      expect(config.systemInstruction).toContain('untrusted');
      expect(config.maxOutputTokens).toBe(1200);
      config.abortSignal.addEventListener('abort', () => reject(new Error('sensitive-provider-detail')), { once: true });
    }));
    const pending = analyzeExceptionWithMultiModelRouting(record, { apiKey: 'test-key', circuitBreaker: new AiModelCircuitBreaker() });
    await vi.advanceTimersByTimeAsync(12001);
    expect((await pending).modelUsed).toBe('ShaRecon-Deterministic-Fallback');
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('sensitive-provider-detail');
  });
  it('does not call providers for an already cancelled request', async () => {
    generateContent.mockClear();
    await expect(analyzeExceptionWithMultiModelRouting(record, { apiKey: 'test-key', signal: AbortSignal.abort() })).rejects.toThrow();
    expect(generateContent).not.toHaveBeenCalled();
  });
});

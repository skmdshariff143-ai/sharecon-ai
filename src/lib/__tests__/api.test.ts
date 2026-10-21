import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analyze-exception/route';
import { GET } from '@/app/api/health/route';
import { RequestGuard, readBoundedJson } from '../server/request-guard';
import { generateSyntheticDataset } from '../dataset/generator';
import { reconcileBatch } from '../engine/matcher';

const data = generateSyntheticDataset(42);
const record = reconcileBatch(data.payments, data.settlements, data.bankTransactions).records[0];
function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/analyze-exception', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body,
  });
}
beforeEach(() => {
  vi.stubEnv('AI_PROVIDER_ENABLED', 'false');
  vi.stubEnv('GEMINI_API_KEY', '');
  vi.stubEnv('ANALYSIS_API_TOKEN', '');
  vi.stubEnv('APP_ORIGIN', '');
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Analysis API boundaries', () => {
  it('returns offline analysis with request correlation and no caching', async () => {
    const result = await POST(request(JSON.stringify({ record })));
    expect(result.status).toBe(200);
    const payload = await result.json();
    expect(payload.analysis.isFallback).toBe(true);
    expect(payload.requestId).toBe(result.headers.get('x-request-id'));
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(record.payment.paymentId);
  });
  it('rejects malformed JSON, malformed evidence and unsupported media types', async () => {
    expect((await POST(request('{'))).status).toBe(400);
    expect((await POST(request(JSON.stringify({ record: { ...record, evidence: { details: {} } } })))).status).toBe(400);
    expect((await POST(request('{}', { 'content-type': 'text/plain' }))).status).toBe(415);
  });
  it('enforces byte limits even without Content-Length', async () => {
    expect((await POST(request(' '.repeat(65537)))).status).toBe(413);
    expect((await POST(request('{}', { 'content-length': '65537' }))).status).toBe(413);
  });
  it('rejects cross-site browser requests', async () => {
    expect((await POST(request('{}', { origin: 'https://attacker.invalid' }))).status).toBe(403);
    expect((await POST(request('{}', { 'sec-fetch-site': 'cross-site' }))).status).toBe(403);
  });
  it('fails closed on provider configuration and requires authenticated access', async () => {
    vi.stubEnv('AI_PROVIDER_ENABLED', 'true');
    expect((await POST(request('{}'))).status).toBe(503);
    expect(GET().status).toBe(503);
    vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
    vi.stubEnv('ANALYSIS_API_TOKEN', 'x'.repeat(32));
    expect((await POST(request('{}'))).status).toBe(401);
    expect((await POST(request('{}', { authorization: 'Bearer wrong' }))).status).toBe(401);
    expect(GET().status).toBe(200);
  });
  it('exposes only minimal health information', async () => {
    expect(await GET().json()).toEqual({ status: 'ok' });
  });
  it('limits global in-flight work and releases capacity once', () => {
    const guard = new RequestGuard(2, 1);
    const release = guard.acquire(100000)!;
    expect(guard.acquire(100000)).toBeUndefined();
    release(); release();
    const second = guard.acquire(100000)!;
    second();
    expect(guard.acquire(100000)).toBeUndefined();
    expect(guard.acquire(160001)).toBeTypeOf('function');
  });
  it('terminates a stalled upload instead of holding capacity indefinitely', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const stalled = new Request('http://localhost', { method: 'POST', body, duplex: 'half' } as RequestInit);
    await expect(readBoundedJson(stalled, 100, 10)).rejects.toMatchObject({ status: 408 });
    expect(cancel).toHaveBeenCalled();
  });
});

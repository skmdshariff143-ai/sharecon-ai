import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeExceptionRequestBodySchema, analyzeExceptionWithMultiModelRouting, generateDeterministicFallbackAnalysis } from '@/lib/ai/analyst';
import { readServerConfig } from '@/lib/server/config';
import { RequestBodyError, RequestGuard, readBoundedJson } from '@/lib/server/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;
const guard = new RequestGuard();

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = performance.now();
  const respond = (body: object, status = 200) => {
    console.info(JSON.stringify({ event: 'exception_analysis', requestId, status, durationMs: Math.round(performance.now() - start) }));
    return NextResponse.json({ ...body, requestId }, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId, ...(status === 429 ? { 'Retry-After': '60' } : {}) },
    });
  };
  const config = readServerConfig();
  if (!config.success) return respond({ success: false, error: 'Service configuration unavailable.' }, 503);
  const origin = req.headers.get('origin');
  const allowedOrigin = new URL(config.data.APP_ORIGIN ?? req.url).origin;
  if ((origin && origin !== allowedOrigin) || req.headers.get('sec-fetch-site') === 'cross-site') {
    return respond({ success: false, error: 'Cross-origin requests are not allowed.' }, 403);
  }
  if (config.data.AI_PROVIDER_ENABLED === 'true') {
    const supplied = Buffer.from(req.headers.get('authorization') ?? '');
    const expected = Buffer.from('Bearer ' + config.data.ANALYSIS_API_TOKEN);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return respond({ success: false, error: 'Authenticated API access is required for provider analysis.' }, 401);
    }
  }
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return respond({ success: false, error: 'Content-Type must be application/json.' }, 415);
  }
  const release = guard.acquire();
  if (!release) return respond({ success: false, error: 'Analysis capacity exceeded. Try again later.' }, 429);
  try {
    const parsed = AnalyzeExceptionRequestBodySchema.safeParse(await readBoundedJson(req));
    if (!parsed.success) return respond({
      success: false, error: 'Invalid reconciliation record structure.',
      issues: parsed.error.issues.slice(0, 20).map(issue => issue.path.join('.') + ': ' + issue.message),
    }, 400);
    const analysis = config.data.AI_PROVIDER_ENABLED === 'true'
      ? await analyzeExceptionWithMultiModelRouting(parsed.data.record, { apiKey: config.data.GEMINI_API_KEY, signal: req.signal })
      : generateDeterministicFallbackAnalysis(parsed.data.record);
    return respond({ success: true, analysis });
  } catch (error) {
    if (error instanceof RequestBodyError) return respond({ success: false, error: error.message }, error.status);
    // Never log payloads, credentials, provider responses or raw exception text.
    return respond({ success: false, error: 'Unable to complete exception analysis.' }, 500);
  } finally { release(); }
}

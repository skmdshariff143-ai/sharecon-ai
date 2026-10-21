import { readServerConfig } from '@/lib/server/config';
export const dynamic = 'force-dynamic';

/** Stateless readiness: provider outages degrade to offline analysis, not unready. */
export function GET() {
  const ready = readServerConfig().success;
  return Response.json({ status: ready ? 'ok' : 'unavailable' }, {
    status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' },
  });
}

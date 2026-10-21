/** Per-process backstop. Distributed rate/budget enforcement belongs at authenticated ingress. */
export class RequestGuard {
  private active = 0;
  private windowStart = 0;
  private requests = 0;
  constructor(private readonly maxPerMinute = 30, private readonly maxActive = 4) {}
  acquire(now = Date.now()): (() => void) | undefined {
    if (now - this.windowStart >= 60000) { this.windowStart = now; this.requests = 0; }
    if (this.requests >= this.maxPerMinute || this.active >= this.maxActive) return undefined;
    this.requests++;
    this.active++;
    let released = false;
    return () => { if (!released) { this.active--; released = true; } };
  }
}

export class RequestBodyError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function readBoundedJson(request: Request, limit = 65536, timeoutMs = 5000): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > limit) throw new RequestBodyError(413, 'Request body exceeds 64 KiB.');
  if (!request.body) throw new RequestBodyError(400, 'JSON body is required.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new RequestBodyError(408, 'Request body timed out.')); void reader.cancel().catch(() => {}); }, timeoutMs);
  });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), timeout]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) throw new RequestBodyError(413, 'Request body exceeds 64 KiB.');
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw new RequestBodyError(400, 'Malformed JSON payload.'); }
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

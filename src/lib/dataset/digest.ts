/** Stable JSON encoding shared by browser exports and independent verifiers. */
export function canonicalJson(value: unknown): string {
  // Normalize exactly as a JSON download would (including optional fields).
  const json: unknown = JSON.parse(JSON.stringify(value));
  function sort(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(sort);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, val]) => [key, sort(val)]));
    }
    return item;
  }
  return JSON.stringify(sort(json));
}

/** Native SHA-256 over UTF-8. Requires HTTPS (or localhost) in browsers. */
export async function computeDeterministicDigest(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

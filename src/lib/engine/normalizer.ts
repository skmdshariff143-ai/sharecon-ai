/**
 * Text and Reference Normalization Utilities for ShaRecon AI
 */

export function normalizeReference(ref: string | null | undefined): string {
  if (!ref) return '';
  return ref.trim().toUpperCase().replace(/[\s\-_/\\#:]+/g, '');
}

export function normalizeUtr(utr: string | null | undefined): string {
  if (!utr) return '';
  return utr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function calculateDateDeltaDays(date1: string, date2: string): number {
  const d1 = parseDateSafe(date1);
  const d2 = parseDateSafe(date2);
  if (!d1 || !d2) return 999;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Computes token similarity ratio (Jaccard similarity on alphanumeric tokens)
 */
export function computeTokenSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const tokens1 = new Set(
    text1
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter((t) => t.length > 2)
  );
  const tokens2 = new Set(
    text2
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter((t) => t.length > 2)
  );

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) intersectionCount++;
  });

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Money Utility Library for ShaRecon AI
 * All financial calculations operate on integer paise.
 * 1 INR = 100 paise.
 */

/**
 * Converts a rupee float or string to integer paise safely.
 * Avoids binary floating-point representation errors.
 */
export function rupeesToPaise(amount: number | string): number {
  const text = String(amount).trim().replace(/^₹\s*/, '');
  // Accept ungrouped, Indian or international grouping; never strip arbitrary text.
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Amount must be a decimal with at most two fractional digits.');
  }
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace(/[-,]/g, '').split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paise)) throw new Error('Amount exceeds the safe integer paise limit.');
  return negative ? -paise : paise;
}

/**
 * Converts integer paise back to rupees as a standard number.
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Formats an integer paise value as an Indian Rupee string (INR)
 * E.g., 154050 -> "₹1,540.50"
 */
export function formatINR(paise: number, includeSymbol = true): string {
  const rupees = paiseToRupees(paise);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rupees));

  const prefix = rupees < 0 ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Calculates standard Razorpay payment gateway fee and 18% GST on fee.
 * Default standard rate: 2.0% + 18% GST on the fee.
 * Example for ₹1000.00 (100000 paise):
 * - Fee: 2.0% = ₹20.00 (2000 paise)
 * - GST on fee: 18% of ₹20 = ₹3.60 (360 paise)
 * - Net: ₹976.40 (97640 paise)
 */
export function calculateStandardFeeAndTax(
  grossPaise: number,
  feeRatePercent = 2.0,
  gstRatePercent = 18.0
): { feePaise: number; taxPaise: number; expectedNetPaise: number } {
  const feePaise = Math.round((grossPaise * feeRatePercent) / 100);
  const taxPaise = Math.round((feePaise * gstRatePercent) / 100);
  const expectedNetPaise = grossPaise - feePaise - taxPaise;
  return { feePaise, taxPaise, expectedNetPaise };
}

/**
 * Validates whether two paise values match within a specified tolerance in paise.
 */
export function isAmountMatching(
  amount1Paise: number,
  amount2Paise: number,
  tolerancePaise = 0
): { matches: boolean; diffPaise: number } {
  const diffPaise = Math.abs(amount1Paise - amount2Paise);
  return {
    matches: diffPaise <= tolerancePaise,
    diffPaise,
  };
}

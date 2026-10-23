import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { rupeesToPaise } from '../money';
import { exportPaymentsCsv, parsePaymentsCsv, parseBankTransactionsCsv, parseSettlementsCsv } from '../dataset/csv';
import { generateSyntheticDataset } from '../dataset/generator';

describe('Financial statement input boundaries', () => {
  it.each(['', 'not money', '12abc', '1e3', 'Infinity', 'NaN', '1.999', '1,2,3', '90071992547410'])('rejects invalid or unsafe money %s', value => {
    expect(() => rupeesToPaise(value)).toThrow();
  });
  it.each([['0.29', 29], ['-0.29', -29], ['₹ 1,54,050.05', 15405005], ['1,234,567.89', 123456789]])('converts %s exactly', (value, expected) => {
    expect(rupeesToPaise(value)).toBe(expected);
  });
  const paymentHeader = 'paymentId,orderId,grossAmount,createdAt\n';
  it('rejects the whole input when any row fails', () => {
    const result = parsePaymentsCsv(paymentHeader + 'good,order,1.00,2026-01-01\nbad,order,abc,2026-01-01');
    expect(result.data).toEqual([]);
    expect(result.errors[0].row).toBe(3);
  });
  it.each(['2026-02-30', 'not-a-date', '09/01/2026', '2026-01-01T12:00:00'])('rejects invalid or ambiguous dates %s', date => {
    expect(parsePaymentsCsv(paymentHeader + `p,o,1.00,${date}`).errors.length).toBeGreaterThan(0);
  });
  it('rejects parser errors and duplicate identifiers', () => {
    expect(parsePaymentsCsv(paymentHeader + 'p,o,1.00,2026-01-01,extra').data).toEqual([]);
    expect(parsePaymentsCsv(paymentHeader + 'pay-1,o,1.00,2026-01-01\nPAY_1,o,1.00,2026-01-01').data).toEqual([]);
  });
  it('rejects inconsistent net amounts, negative credits, empty and oversized statements', () => {
    expect(parsePaymentsCsv('paymentId,orderId,grossAmount,expectedNetAmount,createdAt\np,o,1.00,2.00,2026-01-01').data).toEqual([]);
    expect(parseBankTransactionsCsv('bankTransactionId,utr,creditAmount,creditedAt\nb,u,-1.00,2026-01-01').data).toEqual([]);
    expect(parseSettlementsCsv('').errors.length).toBeGreaterThan(0);
    expect(parsePaymentsCsv('x'.repeat(5 * 1024 * 1024 + 1)).errors[0].message).toContain('5 MiB');
  });
  it('escapes formula injection without changing numeric amounts', () => {
    const payment = { ...generateSyntheticDataset(42).payments[0], orderId: '=HYPERLINK("https://example.invalid")' };
    const csv = exportPaymentsCsv([payment]);
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true }).data[0];
    expect(parsed.orderId).toBe("'" + payment.orderId);
    expect(rupeesToPaise(parsed.grossAmount)).toBe(payment.grossAmount);
  });
});

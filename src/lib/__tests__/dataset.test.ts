import { describe, it, expect } from 'vitest';
import { rupeesToPaise, paiseToRupees, formatINR, calculateStandardFeeAndTax } from '@/lib/money';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import {
  parsePaymentsCsv,
  parseSettlementsCsv,
  parseBankTransactionsCsv,
  exportPaymentsCsv,
} from '@/lib/dataset/csv';

describe('Money Utilities (Integer Paise)', () => {
  it('converts rupee floats and strings to exact integer paise', () => {
    expect(rupeesToPaise(100.5)).toBe(10050);
    expect(rupeesToPaise('₹ 1,540.50')).toBe(154050);
    expect(rupeesToPaise('49.99')).toBe(4999);
    expect(rupeesToPaise(0.01)).toBe(1);
    expect(rupeesToPaise(0)).toBe(0);
  });

  it('converts integer paise back to rupee float', () => {
    expect(paiseToRupees(10050)).toBe(100.5);
    expect(paiseToRupees(154050)).toBe(1540.5);
  });

  it('formats integer paise to Indian Rupee notation', () => {
    expect(formatINR(154050)).toBe('₹1,540.50');
    expect(formatINR(10000000)).toBe('₹1,00,000.00');
  });

  it('calculates standard fee (2%) and 18% GST correctly in integer paise', () => {
    // ₹1000.00 (100,000 paise)
    // Fee = 2% of 100,000 = 2,000 paise (₹20.00)
    // GST = 18% of 2,000 = 360 paise (₹3.60)
    // Net = 100,000 - 2,000 - 360 = 97,640 paise (₹976.40)
    const result = calculateStandardFeeAndTax(100000, 2.0, 18.0);
    expect(result.feePaise).toBe(2000);
    expect(result.taxPaise).toBe(360);
    expect(result.expectedNetPaise).toBe(97640);
  });
});

describe('Deterministic Synthetic Dataset Generator', () => {
  it('generates reproducible 180 records with identical seed', () => {
    const data1 = generateSyntheticDataset(42);
    const data2 = generateSyntheticDataset(42);

    expect(data1.payments.length).toBe(180);
    expect(data1.groundTruth.length).toBe(180);
    expect(data1.payments[0].paymentId).toBe(data2.payments[0].paymentId);
    expect(data1.payments[0].grossAmount).toBe(data2.payments[0].grossAmount);
  });

  it('generates expected ground truth edge cases', () => {
    const data = generateSyntheticDataset(42);
    const exceptions = new Set(data.groundTruth.map((gt) => gt.expectedExceptionType));

    expect(exceptions.has('CLEAN_MATCH')).toBe(true);
    expect(exceptions.has('DATE_SKEW_MATCH')).toBe(true);
    expect(exceptions.has('MISSING_BANK_CREDIT')).toBe(true);
    expect(exceptions.has('MISSING_SETTLEMENT')).toBe(true);
    expect(exceptions.has('DUPLICATE_SETTLEMENT')).toBe(true);
    expect(exceptions.has('DUPLICATE_BANK_CREDIT')).toBe(true);
    expect(exceptions.has('AMOUNT_MISMATCH')).toBe(true);
    expect(exceptions.has('FEE_TAX_ANOMALY')).toBe(true);
    expect(exceptions.has('DELAYED_SETTLEMENT')).toBe(true);
  });
});

describe('CSV Parsing & Validation', () => {
  it('exports and parses payments CSV correctly', () => {
    const dataset = generateSyntheticDataset(42);
    const csv = exportPaymentsCsv(dataset.payments.slice(0, 10));
    const parseRes = parsePaymentsCsv(csv);

    expect(parseRes.errors.length).toBe(0);
    expect(parseRes.data.length).toBe(10);
    expect(parseRes.data[0].paymentId).toBe(dataset.payments[0].paymentId);
    expect(parseRes.data[0].grossAmount).toBe(dataset.payments[0].grossAmount);
  });

  it('rejects malformed CSV rows with actionable error diagnostics', () => {
    const malformedCsv = `paymentId,orderId,grossAmount,createdAt\n,order_123,500.00,2026-03-01\npay_999,,invalid_amount,\n`;
    const parseRes = parsePaymentsCsv(malformedCsv);

    expect(parseRes.errors.length).toBeGreaterThan(0);
  });

  it('validates settlement and bank transaction CSVs cleanly', () => {
    const validSettlementCsv = `settlementId,paymentReference,settledAmount,utr,settledAt,status\nset_001,pay_001,4899.00,RBIP123456,2026-03-02T10:00:00Z,processed\n`;
    const setRes = parseSettlementsCsv(validSettlementCsv);
    expect(setRes.errors.length).toBe(0);
    expect(setRes.data.length).toBe(1);
    expect(setRes.data[0].settledAmount).toBe(489900);

    const validBankCsv = `bankTransactionId,utr,creditAmount,description,creditedAt\nbnk_001,RBIP123456,4899.00,CMS/RZP/NODAL,2026-03-02T10:00:00Z\n`;
    const bankRes = parseBankTransactionsCsv(validBankCsv);
    expect(bankRes.errors.length).toBe(0);
    expect(bankRes.data.length).toBe(1);
    expect(bankRes.data[0].creditAmount).toBe(489900);
  });
});

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCamt053Xml, parseAmountToPaise } from '../dataset/camt053';

describe('ISO 20022 CAMT.053 XML Bank Statement Adapter', () => {
  it('converts decimal amounts to integer paise accurately', () => {
    expect(parseAmountToPaise('1171.68')).toBe(117168);
    expect(parseAmountToPaise('4910.00')).toBe(491000);
    expect(parseAmountToPaise('0.50')).toBe(50);
    expect(parseAmountToPaise('100,500.25')).toBe(10050025);
  });

  it('parses realistic CAMT.053 XML sample file into normalized BankTransaction records', () => {
    const samplePath = path.join(process.cwd(), 'docs', 'samples', 'sample_camt053_statement.xml');
    const xmlContent = fs.readFileSync(samplePath, 'utf8');

    const result = parseCamt053Xml(xmlContent);

    expect(result.statementId).toBe('STMT_HDFC_CORP_20260302');
    expect(result.currency).toBe('INR');
    expect(result.totalCreditsCount).toBe(2); // 2 credits, 1 debit filtered out
    expect(result.bankTransactions).toHaveLength(2);

    // Transaction 1
    const tx1 = result.bankTransactions[0];
    expect(tx1.bankTransactionId).toBe('CAMT_NT_20260302_001');
    expect(tx1.creditAmount).toBe(117168);
    expect(tx1.utr).toBe('UTR_CMS1000000001');
    expect(tx1.description).toContain('RAZORPAY NODAL SETTLEMENT');
    expect(tx1.creditedAt).toContain('2026-03-02');

    // Transaction 2
    const tx2 = result.bankTransactions[1];
    expect(tx2.bankTransactionId).toBe('CAMT_NT_20260302_002');
    expect(tx2.creditAmount).toBe(491000);
    expect(tx2.utr).toBe('UTR_CMS1000000002');

    expect(result.totalCreditPaise).toBe(117168 + 491000);
  });

  it('throws a descriptive error when parsing invalid or empty XML', () => {
    expect(() => parseCamt053Xml('')).toThrow('Invalid CAMT.053 XML');
    expect(() => parseCamt053Xml('NOT_XML')).toThrow('Invalid CAMT.053 XML');
  });
});

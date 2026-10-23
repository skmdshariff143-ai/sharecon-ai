import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseCamt053Xml } from '../dataset/camt053';
const xml = readFileSync('docs/samples/sample_camt053_statement.xml', 'utf8');

describe('CAMT financial safety', () => {
  it('preserves account identifiers and handles entities and quoted attributes', () => {
    const result = parseCamt053Xml(xml.replaceAll('Ccy="INR"', "Ccy='INR'").replace('RAZORPAY NODAL', 'A &amp; B NODAL'));
    expect(result.accountIbanOrNumber).toBe('50200012345678');
    expect(result.bankTransactions[0].description).toContain('A & B');
  });
  it.each([
    (s: string) => s.replace('</Document>', ''),
    (s: string) => s.replace('<Document ', '<!DOCTYPE foo [<!ENTITY x "boom">]><Document '),
    (s: string) => s.replace('<CdtDbtInd>CRDT</CdtDbtInd>', ''),
    (s: string) => s.replace('<Ccy>INR</Ccy>', '<Ccy>USD</Ccy>'),
    (s: string) => s.replace('Ccy="INR"', 'Ccy="USD"'),
    (s: string) => s.replace('1171.68</Amt>', '1171.68junk</Amt>'),
    (s: string) => s.replace('<Sts>BOOK</Sts>', '<Sts>PDNG</Sts>'),
    (s: string) => s.replace('<Dt>2026-03-02</Dt>', '<Dt>2026-02-30</Dt>'),
    (s: string) => s.replace('</TxDtls>', '</TxDtls><TxDtls><Refs><TxId>second</TxId></Refs></TxDtls>'),
    (s: string) => s.replace('NT_20260302_002', 'NT_20260302_001'),
  ])('rejects malformed, ambiguous or unsupported financial input %#', mutate => {
    expect(() => parseCamt053Xml(mutate(xml))).toThrow('Invalid CAMT.053 XML');
  });
  it('does not count reversed credits as received funds', () => {
    const result = parseCamt053Xml(xml.replace('<CdtDbtInd>CRDT</CdtDbtInd>', '<CdtDbtInd>CRDT</CdtDbtInd><RvslInd>true</RvslInd>'));
    expect(result.totalCreditsCount).toBe(1);
    expect(result.totalCreditPaise).toBe(491000);
  });
});

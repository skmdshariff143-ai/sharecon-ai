/**
 * ISO 20022 CAMT.053 XML Bank Statement Adapter for ShaRecon AI
 * Parses Bank-to-Customer Statement (camt.053.001.02 / camt.053.001.08) XML files
 * and normalizes bank entries into standard BankTransaction data models.
 */

import { BankTransaction } from '@/types/reconciliation';

export interface Camt053ParseResult {
  statementId: string;
  accountIbanOrNumber: string;
  currency: string;
  statementDate: string;
  bankTransactions: BankTransaction[];
  totalCreditsCount: number;
  totalCreditPaise: number;
}

/**
 * Extracts inner text of an XML tag, ignoring namespaces.
 */
function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<(?:[\\w]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extracts all matching block occurrences of a given tag.
 */
function extractTagBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<(?:[\\w]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tagName}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Normalizes decimal amount string (e.g. "1171.68" or "1500") into integer paise (e.g. 117168 or 150000).
 */
export function parseAmountToPaise(amtStr: string): number {
  const cleaned = amtStr.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Extracts UTR or reference from remittance info or transaction details.
 */
function extractUtr(ntryXml: string, fallbackId: string): string {
  // 1. Look for EndToEndId
  const endToEnd = extractTagContent(ntryXml, 'EndToEndId');
  if (endToEnd && endToEnd !== 'NOTPROVIDED' && endToEnd !== '/NOTPROVIDED/') {
    return endToEnd;
  }

  // 2. Look for AcctSvcrRef
  const acctRef = extractTagContent(ntryXml, 'AcctSvcrRef');
  if (acctRef && acctRef !== 'NOTPROVIDED') {
    return acctRef;
  }

  // 3. Look for TxId
  const txId = extractTagContent(ntryXml, 'TxId');
  if (txId && txId !== 'NOTPROVIDED') {
    return txId;
  }

  // 4. Regex scan within unstructured remittance info (Ustrd) for UTR or CMS patterns
  const ustrd = extractTagContent(ntryXml, 'Ustrd') || extractTagContent(ntryXml, 'AddtlNtryInf') || '';
  const utrPattern = /(?:UTR|CMS|REF|NEFT|RTGS|IMPS)[:\s-]*([A-Za-z0-9_]{6,30})/i;
  const utrMatch = ustrd.match(utrPattern);
  if (utrMatch) {
    return utrMatch[1];
  }

  return `UTR_${fallbackId}`;
}

/**
 * Parses raw ISO 20022 CAMT.053 XML string into normalized BankTransaction records.
 */
export function parseCamt053Xml(xmlString: string): Camt053ParseResult {
  if (!xmlString || !xmlString.includes('<')) {
    throw new Error('Invalid CAMT.053 XML: empty or non-XML input provided.');
  }

  const statementId = extractTagContent(xmlString, 'Id') || `STMT_${Date.now()}`;
  const accountIbanOrNumber =
    extractTagContent(xmlString, 'IBAN') ||
    extractTagContent(xmlString, 'Othr') ||
    'PRIMARY_CORP_ACCOUNT';
  const statementDate = extractTagContent(xmlString, 'CreDtTm') || new Date().toISOString();

  // Extract all <Ntry> (Entry) blocks
  const ntryBlocks = extractTagBlocks(xmlString, 'Ntry');
  const bankTransactions: BankTransaction[] = [];
  let totalCreditPaise = 0;
  let defaultCurrency = 'INR';

  ntryBlocks.forEach((ntry, index) => {
    // Check credit vs debit indicator: CRDT vs DBIT
    const cdtDbtInd = extractTagContent(ntry, 'CdtDbtInd') || 'CRDT';
    
    // Extract raw amount tag with optional Currency attribute
    const amtRegex = /<(?:[\w]+:)?Amt(?:\s+Ccy="([^"]+)")?>([\s\S]*?)<\/(?:[\w]+:)?Amt>/i;
    const amtMatch = ntry.match(amtRegex);
    const currency = amtMatch && amtMatch[1] ? amtMatch[1] : defaultCurrency;
    defaultCurrency = currency;
    const rawAmt = amtMatch ? amtMatch[2].trim() : '0';
    const amountPaise = parseAmountToPaise(rawAmt);

    // Filter to credit transactions (inbound deposits/settlements)
    if (cdtDbtInd.toUpperCase() === 'CRDT' && amountPaise > 0) {
      // Determine booking or value date
      let creditedAt =
        extractTagContent(ntry, 'DtTm') ||
        extractTagContent(ntry, 'Dt') ||
        new Date().toISOString();

      if (creditedAt.length === 10 && creditedAt.includes('-')) {
        creditedAt = `${creditedAt}T12:00:00.000Z`;
      }

      const entryRef = extractTagContent(ntry, 'NtryRef') || `btx_${index + 1}`;
      const bankTransactionId = `CAMT_${entryRef}`;
      const utr = extractUtr(ntry, `${index + 1}`);
      const description =
        extractTagContent(ntry, 'Ustrd') ||
        extractTagContent(ntry, 'AddtlNtryInf') ||
        `CAMT.053 Bank Credit - ${utr}`;

      bankTransactions.push({
        bankTransactionId,
        utr,
        creditAmount: amountPaise,
        description,
        creditedAt,
      });

      totalCreditPaise += amountPaise;
    }
  });

  return {
    statementId,
    accountIbanOrNumber,
    currency: defaultCurrency,
    statementDate,
    bankTransactions,
    totalCreditsCount: bankTransactions.length,
    totalCreditPaise,
  };
}

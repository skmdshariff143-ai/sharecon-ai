/** CAMT.053 booked INR credits; rejects ambiguous aggregates and unsupported statements. */
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { BankTransaction } from '@/types/reconciliation';
import { BankTransactionSchema, DateSchema, IdentifierSchema, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from '../validation';
import { rupeesToPaise } from '../money';

export interface Camt053ParseResult {
  statementId: string;
  accountIbanOrNumber: string;
  currency: string;
  statementDate: string;
  bankTransactions: BankTransaction[];
  totalCreditsCount: number;
  totalCreditPaise: number;
}
export const parseAmountToPaise = rupeesToPaise;
type XmlObject = Record<string, unknown>;
function object(value: unknown): XmlObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected one XML element.');
  return value as XmlObject;
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Required XML text is missing or repeated.');
  return value.trim();
}
const list = (value: unknown): unknown[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
function optionalObject(value: unknown): XmlObject { return value === undefined ? {} : object(value); }

export function parseCamt053Xml(xml: string): Camt053ParseResult {
  try {
    if (!xml || new TextEncoder().encode(xml).byteLength > MAX_IMPORT_BYTES) throw new Error('Input is empty or exceeds 5 MiB.');
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entity declarations are not supported.');
    if (XMLValidator.validate(xml) !== true) throw new Error('Malformed XML document.');
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false,
      parseAttributeValue: false, trimValues: true, maxNestedTags: 32 });
    const parsed: unknown = parser.parse(xml);
    const message = object(object(object(parsed).Document).BkToCstmrStmt);
    const statement = object(message.Stmt); // Multiple accounts/statements must be imported separately.
    const statementId = IdentifierSchema.parse(statement.Id);
    const statementDate = DateSchema.parse(statement.CreDtTm);
    const account = object(statement.Acct);
    const accountId = object(account.Id);
    const accountIbanOrNumber = IdentifierSchema.parse(accountId.IBAN ?? object(accountId.Othr).Id);
    const currency = text(account.Ccy);
    if (currency !== 'INR') throw new Error('Only INR statements are supported.');
    const entries = list(statement.Ntry);
    if (entries.length > MAX_IMPORT_ROWS) throw new Error('Statement exceeds 10,000 entries.');
    const bankTransactions: BankTransaction[] = [];
    const ids = new Set<string>();
    let totalCreditPaise = 0;
    for (const [index, raw] of entries.entries()) {
      const entry = object(raw);
      const direction = text(entry.CdtDbtInd);
      if (direction !== 'CRDT' && direction !== 'DBIT') throw new Error('Missing or unsupported credit/debit direction.');
      if (direction === 'DBIT') continue;
      if (entry.RvslInd !== undefined && !['true', 'false', '0', '1'].includes(text(entry.RvslInd))) throw new Error('Invalid reversal flag.');
      if (entry.RvslInd === 'true' || entry.RvslInd === '1') continue;
      const status = typeof entry.Sts === 'string' ? entry.Sts : object(entry.Sts).Cd;
      if (status !== 'BOOK') throw new Error('Only booked credits can be reconciled.');
      const amount = object(entry.Amt);
      if (amount['@_Ccy'] !== 'INR') throw new Error('Credit currency must be explicitly INR.');
      const creditAmount = rupeesToPaise(text(amount['#text']));
      const booking = object(entry.BookgDt);
      const creditedAt = DateSchema.parse(booking.DtTm ?? booking.Dt);
      const details = optionalObject(entry.NtryDtls);
      if (Array.isArray(details.TxDtls)) throw new Error('Aggregated entries with multiple transactions require a dedicated batch adapter.');
      const transaction = optionalObject(details.TxDtls);
      const refs = optionalObject(transaction.Refs);
      const utr = [refs.EndToEndId, entry.AcctSvcrRef, refs.TxId].find(value =>
        typeof value === 'string' && value.trim() && !['NOTPROVIDED', '/NOTPROVIDED/'].includes(value.toUpperCase()));
      if (!utr) throw new Error('Credit has no traceable UTR/reference.');
      const entryRef = entry.NtryRef ?? statementId + '_' + (index + 1);
      const bankTransactionId = 'CAMT_' + IdentifierSchema.parse(entryRef);
      if (ids.has(bankTransactionId)) throw new Error('Duplicate bank entry identifier.');
      ids.add(bankTransactionId);
      const remittance = optionalObject(transaction.RmtInf);
      const description = list(remittance.Ustrd).map(text).join(' ') ||
        (entry.AddtlNtryInf ? text(entry.AddtlNtryInf) : 'CAMT.053 Bank Credit');
      bankTransactions.push(BankTransactionSchema.parse({ bankTransactionId, utr, creditAmount, description, creditedAt }));
      totalCreditPaise += creditAmount;
      if (!Number.isSafeInteger(totalCreditPaise)) throw new Error('Statement total exceeds safe integer paise.');
    }
    if (!bankTransactions.length) throw new Error('Statement contains no booked non-reversal credits.');
    return { statementId, accountIbanOrNumber, currency, statementDate, bankTransactions,
      totalCreditsCount: bankTransactions.length, totalCreditPaise };
  } catch (error) {
    throw new Error('Invalid CAMT.053 XML: ' + (error instanceof Error ? error.message : 'Unsupported statement.'));
  }
}

/** Atomic, bounded statement imports. Amount columns are decimal INR, outputs integer paise. */
import Papa from 'papaparse';
import { z } from 'zod';
import { Payment, Settlement, BankTransaction } from '@/types/reconciliation';
import { paiseToRupees, rupeesToPaise } from '@/lib/money';
import { PaymentSchema, SettlementSchema, BankTransactionSchema, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from '@/lib/validation';
import { normalizeReference } from '@/lib/engine/normalizer';

const MoneyInput = z.union([z.string(), z.number()]).transform((value, ctx) => {
  try { return rupeesToPaise(value); }
  catch (error) {
    ctx.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Invalid amount' });
    return z.NEVER;
  }
});
const OptionalMoney = z.preprocess(value => value === '' ? undefined : value, MoneyInput.optional());

export const PaymentCsvRowSchema = z.object({
  paymentId: z.string(), orderId: z.string(), grossAmount: MoneyInput,
  fee: OptionalMoney, tax: OptionalMoney, expectedNetAmount: OptionalMoney,
  currency: z.string().default('INR'),
  status: z.string().default('captured'), createdAt: z.string(),
}).transform(row => ({ ...row, fee: row.fee ?? 0, tax: row.tax ?? 0,
  expectedNetAmount: row.expectedNetAmount ?? row.grossAmount - (row.fee ?? 0) - (row.tax ?? 0),
})).pipe(PaymentSchema);

export const SettlementCsvRowSchema = SettlementSchema.extend({
  settledAmount: MoneyInput, status: SettlementSchema.shape.status.default('processed'),
}).pipe(SettlementSchema);
export const BankTransactionCsvRowSchema = BankTransactionSchema.extend({
  creditAmount: MoneyInput, description: z.string().default(''),
}).pipe(BankTransactionSchema);

export interface CsvParseResult<T> {
  data: T[];
  errors: { row: number; field?: string; message: string }[];
  totalRows: number;
}

function parseStatement<T>(text: string, schema: z.ZodType<T>, id: keyof T): CsvParseResult<T> {
  const errors: CsvParseResult<T>['errors'] = [];
  const fail = (message: string): CsvParseResult<T> => ({ data: [], errors: [{ row: 1, message }], totalRows: 0 });
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) return fail('Statement exceeds 5 MiB.');
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true, skipEmptyLines: 'greedy', preview: MAX_IMPORT_ROWS + 1,
    transformHeader: header => header.trim(),
  });
  if (parsed.data.length > MAX_IMPORT_ROWS || parsed.meta.truncated) return fail('Statement exceeds 10,000 rows.');
  if (!parsed.data.length) return fail('Statement has no data rows.');
  if (parsed.meta.renamedHeaders && Object.keys(parsed.meta.renamedHeaders).length) return fail('Duplicate column headers are not allowed.');
  parsed.errors.forEach(error => errors.push({ row: (error.row ?? 0) + 2, message: error.message }));
  const data: T[] = [];
  const ids = new Set<string>();
  let totalPaise = 0;
  parsed.data.forEach((row, index) => {
    const result = schema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach(issue => errors.push({ row: index + 2, field: issue.path.join('.'), message: issue.message }));
      return;
    }
    const key = normalizeReference(String(result.data[id]));
    if (ids.has(key)) errors.push({ row: index + 2, field: String(id), message: 'Duplicate normalized identifier.' });
    ids.add(key);
    const amounts = result.data as Record<string, unknown>;
    totalPaise += Number(amounts.grossAmount ?? amounts.settledAmount ?? amounts.creditAmount);
    if (!Number.isSafeInteger(totalPaise)) errors.push({ row: index + 2, message: 'Statement total exceeds safe integer paise.' });
    data.push(result.data);
  });
  // A financial statement is one atomic input. Never silently reconcile a valid subset.
  return { data: errors.length ? [] : data, errors, totalRows: parsed.data.length };
}

export const parsePaymentsCsv = (text: string): CsvParseResult<Payment> => parseStatement(text, PaymentCsvRowSchema, 'paymentId');
export const parseSettlementsCsv = (text: string): CsvParseResult<Settlement> => parseStatement(text, SettlementCsvRowSchema, 'settlementId');
export const parseBankTransactionsCsv = (text: string): CsvParseResult<BankTransaction> => parseStatement(text, BankTransactionCsvRowSchema, 'bankTransactionId');

export function exportPaymentsCsv(payments: Payment[]): string {
  const unparsed = payments.map((p) => ({
    paymentId: p.paymentId,
    orderId: p.orderId,
    grossAmount: paiseToRupees(p.grossAmount).toFixed(2),
    fee: paiseToRupees(p.fee).toFixed(2),
    tax: paiseToRupees(p.tax).toFixed(2),
    expectedNetAmount: paiseToRupees(p.expectedNetAmount).toFixed(2),
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
  }));
  return Papa.unparse(unparsed, { escapeFormulae: /^[\s]*[=+@\-\t\r]/ });
}

export function exportSettlementsCsv(settlements: Settlement[]): string {
  const unparsed = settlements.map((s) => ({
    settlementId: s.settlementId,
    paymentReference: s.paymentReference,
    settledAmount: paiseToRupees(s.settledAmount).toFixed(2),
    utr: s.utr,
    settledAt: s.settledAt,
    status: s.status,
  }));
  return Papa.unparse(unparsed, { escapeFormulae: /^[\s]*[=+@\-\t\r]/ });
}

export function exportBankTransactionsCsv(bankTransactions: BankTransaction[]): string {
  const unparsed = bankTransactions.map((b) => ({
    bankTransactionId: b.bankTransactionId,
    utr: b.utr,
    creditAmount: paiseToRupees(b.creditAmount).toFixed(2),
    description: b.description,
    creditedAt: b.creditedAt,
  }));
  return Papa.unparse(unparsed, { escapeFormulae: /^[\s]*[=+@\-\t\r]/ });
}

export function exportReconciliationCsv(records: import('@/types/reconciliation').ReconciliationRecord[]): string {
  const unparsed = records.map((r) => ({
    'Record ID': r.recordId,
    'Payment ID': r.payment.paymentId,
    'Order ID': r.payment.orderId,
    'Gross Amount (INR)': paiseToRupees(r.payment.grossAmount).toFixed(2),
    'Fee (INR)': paiseToRupees(r.payment.fee).toFixed(2),
    'Tax (INR)': paiseToRupees(r.payment.tax).toFixed(2),
    'Expected Net (INR)': paiseToRupees(r.payment.expectedNetAmount).toFixed(2),
    'Settlement ID': r.matchedSettlement?.settlementId || '',
    'Settled Amount (INR)': r.matchedSettlement ? paiseToRupees(r.matchedSettlement.settledAmount).toFixed(2) : '',
    'Bank Transaction ID': r.matchedBankTransaction?.bankTransactionId || '',
    'Bank Credit Amount (INR)': r.matchedBankTransaction ? paiseToRupees(r.matchedBankTransaction.creditAmount).toFixed(2) : '',
    'Gateway UTR': r.matchedSettlement?.utr || r.matchedBankTransaction?.utr || '',
    'Reconciliation Status': r.status,
    'Confidence Score (%)': r.confidence,
    'Exception Type': r.exceptionType,
    'Financial Exposure (INR)': paiseToRupees(r.financialExposurePaise).toFixed(2),
    'Audit Explanation': r.explanation,
  }));
  return Papa.unparse(unparsed, { escapeFormulae: /^[\s]*[=+@\-\t\r]/ });
}

export function exportExceptionsCsv(records: import('@/types/reconciliation').ReconciliationRecord[]): string {
  const exceptions = records.filter((r) => r.status !== 'AUTO_RECONCILED' && r.status !== 'MANUALLY_APPROVED');
  return exportReconciliationCsv(exceptions);
}

export function exportAuditEventsCsv(events: import('@/types/reconciliation').AuditEvent[]): string {
  const unparsed = events.map((e) => ({
    'Event ID': e.eventId,
    'Timestamp': e.timestamp,
    'Actor': e.actor,
    'Action': e.action,
    'Payment ID': e.entityIds.paymentId || '',
    'Settlement ID': e.entityIds.settlementId || '',
    'Bank Transaction ID': e.entityIds.bankTransactionId || '',
    'Previous State': e.previousState,
    'New State': e.newState,
    'Confidence Score (%)': e.confidence,
    'Reason / Auditor Note': e.reason,
    'Model Used': e.modelUsed || '',
    'Fallback Used': e.fallbackUsed ? 'YES' : 'NO',
  }));
  return Papa.unparse(unparsed, { escapeFormulae: /^[\s]*[=+@\-\t\r]/ });
}


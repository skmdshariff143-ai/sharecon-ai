/**
 * CSV Import / Export Utilities with Schema Validation for ShaRecon AI
 */

import Papa from 'papaparse';
import { z } from 'zod';
import { Payment, Settlement, BankTransaction } from '@/types/reconciliation';
import { paiseToRupees, rupeesToPaise } from '@/lib/money';

// Validation Schemas for CSV Rows
export const PaymentCsvRowSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  orderId: z.string().min(1, 'orderId is required'),
  grossAmount: z.union([z.string(), z.number()]).transform((val) => rupeesToPaise(val)),
  fee: z.union([z.string(), z.number()]).optional().transform((val) => (val ? rupeesToPaise(val) : 0)),
  tax: z.union([z.string(), z.number()]).optional().transform((val) => (val ? rupeesToPaise(val) : 0)),
  expectedNetAmount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? rupeesToPaise(val) : 0)),
  currency: z.string().default('INR'),
  status: z.enum(['captured', 'failed', 'refunded', 'pending']).default('captured'),
  createdAt: z.string().min(1, 'createdAt is required'),
});

export const SettlementCsvRowSchema = z.object({
  settlementId: z.string().min(1, 'settlementId is required'),
  paymentReference: z.string().min(1, 'paymentReference is required'),
  settledAmount: z.union([z.string(), z.number()]).transform((val) => rupeesToPaise(val)),
  utr: z.string().min(1, 'utr is required'),
  settledAt: z.string().min(1, 'settledAt is required'),
  status: z.enum(['processed', 'reversed', 'failed']).default('processed'),
});

export const BankTransactionCsvRowSchema = z.object({
  bankTransactionId: z.string().min(1, 'bankTransactionId is required'),
  utr: z.string().min(1, 'utr is required'),
  creditAmount: z.union([z.string(), z.number()]).transform((val) => rupeesToPaise(val)),
  description: z.string().default(''),
  creditedAt: z.string().min(1, 'creditedAt is required'),
});

export interface CsvParseResult<T> {
  data: T[];
  errors: { row: number; field?: string; message: string }[];
  totalRows: number;
}

export function parsePaymentsCsv(csvText: string): CsvParseResult<Payment> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const validData: Payment[] = [];
  const errors: { row: number; field?: string; message: string }[] = [];

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header
    try {
      const validated = PaymentCsvRowSchema.parse(row);
      // Auto-compute net if not provided
      const expectedNet =
        validated.expectedNetAmount ||
        validated.grossAmount - (validated.fee || 0) - (validated.tax || 0);

      validData.push({
        paymentId: validated.paymentId,
        orderId: validated.orderId,
        grossAmount: validated.grossAmount,
        fee: validated.fee || 0,
        tax: validated.tax || 0,
        expectedNetAmount: expectedNet,
        currency: validated.currency,
        status: validated.status as Payment['status'],
        createdAt: validated.createdAt,
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((issue) => {
          errors.push({
            row: rowNum,
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
      } else {
        errors.push({ row: rowNum, message: 'Invalid payment record structure' });
      }
    }
  });

  return { data: validData, errors, totalRows: parsed.data.length };
}

export function parseSettlementsCsv(csvText: string): CsvParseResult<Settlement> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const validData: Settlement[] = [];
  const errors: { row: number; field?: string; message: string }[] = [];

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      const validated = SettlementCsvRowSchema.parse(row);
      validData.push({
        settlementId: validated.settlementId,
        paymentReference: validated.paymentReference,
        settledAmount: validated.settledAmount,
        utr: validated.utr,
        settledAt: validated.settledAt,
        status: validated.status as Settlement['status'],
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((issue) => {
          errors.push({
            row: rowNum,
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
      } else {
        errors.push({ row: rowNum, message: 'Invalid settlement record structure' });
      }
    }
  });

  return { data: validData, errors, totalRows: parsed.data.length };
}

export function parseBankTransactionsCsv(csvText: string): CsvParseResult<BankTransaction> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const validData: BankTransaction[] = [];
  const errors: { row: number; field?: string; message: string }[] = [];

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      const validated = BankTransactionCsvRowSchema.parse(row);
      validData.push({
        bankTransactionId: validated.bankTransactionId,
        utr: validated.utr,
        creditAmount: validated.creditAmount,
        description: validated.description,
        creditedAt: validated.creditedAt,
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((issue) => {
          errors.push({
            row: rowNum,
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
      } else {
        errors.push({ row: rowNum, message: 'Invalid bank transaction structure' });
      }
    }
  });

  return { data: validData, errors, totalRows: parsed.data.length };
}

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
  return Papa.unparse(unparsed);
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
  return Papa.unparse(unparsed);
}

export function exportBankTransactionsCsv(bankTransactions: BankTransaction[]): string {
  const unparsed = bankTransactions.map((b) => ({
    bankTransactionId: b.bankTransactionId,
    utr: b.utr,
    creditAmount: paiseToRupees(b.creditAmount).toFixed(2),
    description: b.description,
    creditedAt: b.creditedAt,
  }));
  return Papa.unparse(unparsed);
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
  return Papa.unparse(unparsed);
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
  return Papa.unparse(unparsed);
}


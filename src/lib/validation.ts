import { z } from 'zod';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10000;
export const IdentifierSchema = z.string().trim().min(1).max(160);
export const DateSchema = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);
export const PaiseSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

export const PaymentSchema = z.object({
  paymentId: IdentifierSchema,
  orderId: IdentifierSchema,
  grossAmount: PaiseSchema.positive(),
  fee: PaiseSchema,
  tax: PaiseSchema,
  expectedNetAmount: PaiseSchema.positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(['captured', 'failed', 'refunded', 'pending']),
  createdAt: DateSchema,
}).refine(p => p.grossAmount - p.fee - p.tax === p.expectedNetAmount, {
  message: 'Expected net must equal gross minus fee and tax.', path: ['expectedNetAmount'],
});

export const SettlementSchema = z.object({
  settlementId: IdentifierSchema,
  paymentReference: IdentifierSchema,
  settledAmount: PaiseSchema.positive(),
  utr: IdentifierSchema,
  settledAt: DateSchema,
  status: z.enum(['processed', 'reversed', 'failed']),
});

export const BankTransactionSchema = z.object({
  bankTransactionId: IdentifierSchema,
  utr: IdentifierSchema,
  creditAmount: PaiseSchema.positive(),
  description: z.string().max(2000),
  creditedAt: DateSchema,
});

export const EngineConfigSchema = z.object({
  highConfidenceThreshold: z.number().int().min(50).max(100),
  mediumConfidenceThreshold: z.number().int().min(20).max(100),
  maxDateDeltaDays: z.number().int().min(0).max(90),
  feeTolerancePaise: PaiseSchema.max(100000),
  circuitBreakerThresholdPercent: z.number().min(0).max(100),
  dryRun: z.boolean(),
}).refine(c => c.mediumConfidenceThreshold <= c.highConfidenceThreshold, {
  message: 'Review threshold cannot exceed automatic threshold.',
});

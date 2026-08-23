/**
 * Deterministic Synthetic Data Generator for ShaRecon AI
 * Generates 180 realistic records spanning 14 financial edge cases with ground truth.
 */

import {
  Payment,
  Settlement,
  BankTransaction,
  GroundTruth,
  ExceptionType,
  ExpectedOutcome,
} from '@/types/reconciliation';
import { calculateStandardFeeAndTax, rupeesToPaise } from '@/lib/money';

// Seeded pseudo-random number generator (Mulberry32)
function createRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticDataset {
  payments: Payment[];
  settlements: Settlement[];
  bankTransactions: BankTransaction[];
  groundTruth: GroundTruth[];
}

export function generateSyntheticDataset(seed = 42): SyntheticDataset {
  const rand = createRNG(seed);

  const payments: Payment[] = [];
  const settlements: Settlement[] = [];
  const bankTransactions: BankTransaction[] = [];
  const groundTruth: GroundTruth[] = [];

  const baseDate = new Date('2026-03-01T10:00:00.000Z');

  function addDays(d: Date, days: number): Date {
    const res = new Date(d);
    res.setUTCDate(res.getUTCDate() + days);
    return res;
  }

  function formatISO(d: Date): string {
    return d.toISOString();
  }

  // Predefined realistic amounts in Rupees (e.g., standard e-commerce/SaaS ticket sizes)
  const realisticRupeeAmounts = [
    499.0, 999.0, 1499.0, 2499.0, 4999.0, 7500.0, 12000.0, 15450.0, 25000.0, 34999.0,
    50000.0, 750.0, 1299.0, 3999.0, 8990.0, 18500.0, 45000.0, 299.0, 1999.0, 6499.0,
  ];

  let recordCounter = 1;

  function createRecord(
    scenario: ExceptionType,
    outcome: ExpectedOutcome,
    scenarioDescription: string,
    override?: {
      dayOffset?: number;
      settlementDelayDays?: number;
      bankDelayDays?: number;
      feeAnomaly?: boolean;
      amountDiffPaise?: number;
      duplicateSettlement?: boolean;
      duplicateBank?: boolean;
      missingSettlement?: boolean;
      missingBank?: boolean;
      partialRef?: boolean;
      ambiguousRef?: boolean;
      garbledDesc?: boolean;
      unsupportedCurrency?: boolean;
      ambiguousAmount?: number;
    }
  ) {
    const idNum = String(recordCounter).padStart(4, '0');
    const paymentId = `pay_${idNum}_razor`;
    const orderId = `order_${idNum}_store`;
    const utr = `RBIP${String(100000000 + recordCounter * 73).slice(0, 12)}`;

    const dayOffset = override?.dayOffset ?? Math.floor(recordCounter / 6);
    const payDate = addDays(baseDate, dayOffset);
    const settlementDate = addDays(payDate, override?.settlementDelayDays ?? 1);
    const bankDate = addDays(settlementDate, override?.bankDelayDays ?? 0);

    const rupeeAmount =
      override?.ambiguousAmount ??
      realisticRupeeAmounts[recordCounter % realisticRupeeAmounts.length];
    const grossAmount = rupeesToPaise(rupeeAmount);

    // Standard merchant ledger expectation: 2% fee + 18% GST
    const stdRes = calculateStandardFeeAndTax(grossAmount, 2.0, 18.0);
    const feePaise = stdRes.feePaise;
    const taxPaise = stdRes.taxPaise;
    const expectedNetAmount = stdRes.expectedNetPaise;

    const currency = override?.unsupportedCurrency ? 'USD' : 'INR';

    const payment: Payment = {
      paymentId,
      orderId,
      grossAmount,
      fee: feePaise,
      tax: taxPaise,
      expectedNetAmount,
      currency,
      status: 'captured',
      createdAt: formatISO(payDate),
    };
    payments.push(payment);

    let expectedSettlementId: string | null = null;
    let expectedBankId: string | null = null;

    let settledAmount = expectedNetAmount + (override?.amountDiffPaise ?? 0);

    // In fee anomaly, the gateway deducted 3.5% tier fee instead of standard 2.0%
    if (override?.feeAnomaly) {
      const anomalyRes = calculateStandardFeeAndTax(grossAmount, 3.5, 18.0);
      settledAmount = anomalyRes.expectedNetPaise;
    }

    if (!override?.missingSettlement) {
      const settlementId = `set_${idNum}_rzp`;
      expectedSettlementId = settlementId;

      const paymentReference = override?.partialRef
        ? orderId
        : override?.ambiguousRef
        ? 'BATCH_RECURRING_SUB'
        : paymentId;

      const settlement: Settlement = {
        settlementId,
        paymentReference,
        settledAmount,
        utr,
        settledAt: formatISO(settlementDate),
        status: 'processed',
      };
      settlements.push(settlement);

      if (override?.duplicateSettlement) {
        const dupSettlement: Settlement = {
          settlementId: `set_${idNum}_rzp_dup`,
          paymentReference,
          settledAmount,
          utr: `${utr}_DUP`,
          settledAt: formatISO(addDays(settlementDate, 1)),
          status: 'processed',
        };
        settlements.push(dupSettlement);
      }
    }

    if (!override?.missingBank) {
      const bankTransactionId = `bnk_${idNum}_hdfc`;
      expectedBankId = bankTransactionId;

      const creditAmount = settledAmount;

      const description = override?.garbledDesc
        ? `CMS/RZP/NODAL/TXN${idNum}/REF-PARTIAL`
        : `CMS/RAZORPAY NODAL/${utr}/SETTLEMENT ${paymentId}`;

      const bankTx: BankTransaction = {
        bankTransactionId,
        utr,
        creditAmount,
        description,
        creditedAt: formatISO(bankDate),
      };
      bankTransactions.push(bankTx);

      if (override?.duplicateBank) {
        const dupBankTx: BankTransaction = {
          bankTransactionId: `bnk_${idNum}_hdfc_dup`,
          utr,
          creditAmount,
          description: `CMS/RAZORPAY NODAL/${utr}/DUPLICATE ADVICE`,
          creditedAt: formatISO(addDays(bankDate, 1)),
        };
        bankTransactions.push(dupBankTx);
      }
    }

    groundTruth.push({
      paymentId,
      expectedSettlementId,
      expectedBankTransactionId: expectedBankId,
      expectedExceptionType: scenario,
      expectedOutcome: outcome,
      scenarioDescription,
    });

    recordCounter++;
  }

  // 1. CLEAN_MATCH (80 records) - Clean exact 3-way matches (T+1 settlement)
  for (let i = 0; i < 80; i++) {
    createRecord(
      'CLEAN_MATCH',
      'auto_reconciled',
      'Clean exact match with valid UTR, net amount, and T+1 bank settlement'
    );
  }

  // 2. DATE_SKEW_MATCH (18 records) - Valid bank delay (T+2 / T+3) due to banking cutoff
  for (let i = 0; i < 18; i++) {
    const bankDelay = (i % 2) + 2; // 2 or 3 days
    createRecord(
      'DATE_SKEW_MATCH',
      'auto_reconciled',
      `Bank credit credited ${bankDelay} days after settlement (weekend/holiday skew)`,
      { bankDelayDays: bankDelay }
    );
  }

  // 3. MISSING_BANK_CREDIT (12 records) - Settlement created but bank credit not recorded
  for (let i = 0; i < 12; i++) {
    createRecord(
      'MISSING_BANK_CREDIT',
      'unmatched_exception',
      'Payment settled by gateway but bank credit advice missing from statement',
      { missingBank: true }
    );
  }

  // 4. MISSING_SETTLEMENT (10 records) - Payment captured but not settled by Razorpay
  for (let i = 0; i < 10; i++) {
    createRecord(
      'MISSING_SETTLEMENT',
      'unmatched_exception',
      'Payment captured in gateway but missing settlement advice record',
      { missingSettlement: true, missingBank: true }
    );
  }

  // 5. DUPLICATE_SETTLEMENT (8 records) - Multiple settlement entries for one payment
  for (let i = 0; i < 8; i++) {
    createRecord(
      'DUPLICATE_SETTLEMENT',
      'manual_review',
      'Duplicate settlement record received from payment gateway',
      { duplicateSettlement: true }
    );
  }

  // 6. DUPLICATE_BANK_CREDIT (8 records) - Multiple bank credits for single UTR
  for (let i = 0; i < 8; i++) {
    createRecord(
      'DUPLICATE_BANK_CREDIT',
      'manual_review',
      'Duplicate credit entry found in merchant bank account with same UTR',
      { duplicateBank: true }
    );
  }

  // 7. AMOUNT_MISMATCH (10 records) - Settlement amount differs by > ₹100
  for (let i = 0; i < 10; i++) {
    const diffPaise = (i % 2 === 0 ? 1 : -1) * (15000 + i * 2000); // +/- ₹150 to ₹330
    createRecord(
      'AMOUNT_MISMATCH',
      'manual_review',
      `Settlement amount differs from expected net by ₹${Math.abs(diffPaise) / 100}`,
      { amountDiffPaise: diffPaise }
    );
  }

  // 8. FEE_TAX_ANOMALY (8 records) - Custom fee rate (3.5% instead of 2.0%)
  for (let i = 0; i < 8; i++) {
    createRecord(
      'FEE_TAX_ANOMALY',
      'manual_review',
      'Unusual gateway fee rate applied (3.5% tier fee)',
      { feeAnomaly: true }
    );
  }

  // 9. DELAYED_SETTLEMENT (8 records) - Settlement delayed 7 days
  for (let i = 0; i < 8; i++) {
    createRecord(
      'DELAYED_SETTLEMENT',
      'manual_review',
      'Settlement delayed over 7 days past standard T+1 SLA window',
      { settlementDelayDays: 7, bankDelayDays: 1 }
    );
  }

  // 10. INCONSISTENT_DESCRIPTION (8 records) - Truncated bank description
  for (let i = 0; i < 8; i++) {
    createRecord(
      'INCONSISTENT_DESCRIPTION',
      'auto_reconciled',
      'Bank statement description truncated but UTR and amount match',
      { garbledDesc: true }
    );
  }

  // 11. PARTIALLY_MISSING_REF (5 records) - Settlement references orderId instead of paymentId
  for (let i = 0; i < 5; i++) {
    createRecord(
      'PARTIALLY_MISSING_REF',
      'auto_reconciled',
      'Settlement references Order ID instead of direct Payment ID',
      { partialRef: true }
    );
  }

  // 12. AMBIGUOUS_AMOUNT (5 records) - Identical amount on same day with ambiguous reference
  for (let i = 0; i < 5; i++) {
    createRecord(
      'AMBIGUOUS_AMOUNT',
      'manual_review',
      'Identical recurring subscription amount on same date with generic reference',
      { ambiguousAmount: 999.0, dayOffset: 15, ambiguousRef: true }
    );
  }

  // Shuffle settlements and bankTransactions deterministically so order does not hint match
  function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return {
    payments,
    settlements: shuffle(settlements),
    bankTransactions: shuffle(bankTransactions),
    groundTruth,
  };
}

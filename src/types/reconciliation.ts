/**
 * Core Data Models and Types for ShaRecon AI
 * All monetary amounts are in integer paise (1 INR = 100 paise).
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type WorkspaceTab =
  | 'control_center'
  | 'reconciliation'
  | 'exceptions'
  | 'audit'
  | 'evaluation'
  | 'methodology'
  | 'help';

export interface Payment {
  paymentId: string;
  orderId: string;
  grossAmount: number; // in integer paise
  fee: number; // in integer paise
  tax: number; // in integer paise
  expectedNetAmount: number; // in integer paise
  currency: string;
  status: 'captured' | 'failed' | 'refunded' | 'pending';
  createdAt: string; // ISO 8601
}

export interface Settlement {
  settlementId: string;
  paymentReference: string; // paymentId or orderId reference
  settledAmount: number; // in integer paise
  utr: string;
  settledAt: string; // ISO 8601
  status: 'processed' | 'reversed' | 'failed';
}

export interface BankTransaction {
  bankTransactionId: string;
  utr: string;
  creditAmount: number; // in integer paise
  description: string;
  creditedAt: string; // ISO 8601
}

export type ExceptionType =
  | 'CLEAN_MATCH'
  | 'DATE_SKEW_MATCH'
  | 'MISSING_BANK_CREDIT'
  | 'MISSING_SETTLEMENT'
  | 'DUPLICATE_SETTLEMENT'
  | 'DUPLICATE_BANK_CREDIT'
  | 'AMOUNT_MISMATCH'
  | 'FEE_TAX_ANOMALY'
  | 'DELAYED_SETTLEMENT'
  | 'INCONSISTENT_DESCRIPTION'
  | 'PARTIALLY_MISSING_REF'
  | 'AMBIGUOUS_AMOUNT'
  | 'MALFORMED_ROW'
  | 'UNSUPPORTED_CURRENCY';

export type ExpectedOutcome = 'auto_reconciled' | 'manual_review' | 'unmatched_exception';

export interface GroundTruth {
  paymentId: string;
  expectedSettlementId: string | null;
  expectedBankTransactionId: string | null;
  expectedExceptionType: ExceptionType;
  expectedOutcome: ExpectedOutcome;
  scenarioDescription: string;
}

export interface EvidenceBreakdown {
  referenceScore: number; // Max 40
  amountScore: number; // Max 35
  dateScore: number; // Max 15
  descriptionScore: number; // Max 10
  totalConfidence: number; // 0 to 100
  details: {
    referenceMatch: 'EXACT_PAYMENT_ID' | 'EXACT_ORDER_ID' | 'PARTIAL_REF' | 'NONE';
    utrMatch: 'EXACT_UTR' | 'FUZZY_UTR' | 'NONE';
    amountDifferencePaise: number;
    amountTolerancePassed: boolean;
    dateDeltaDays: number;
    descriptionSimilarityRatio: number;
  };
}

export type MatchStatus =
  | 'AUTO_RECONCILED'
  | 'PENDING_REVIEW'
  | 'MANUALLY_APPROVED'
  | 'MANUALLY_REJECTED'
  | 'UNMATCHED_EXCEPTION';

export interface AiExceptionAnalysis {
  exceptionCategory: ExceptionType;
  summary: string;
  recommendedAction: string;
  missingInformation: string[];
  reviewerNote: string;
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  modelUsed: string;
  isFallback: boolean;
  analyzedAt: string;
}

export interface ReconciliationRecord {
  recordId: string; // usually paymentId
  payment: Payment;
  matchedSettlement: Settlement | null;
  matchedBankTransaction: BankTransaction | null;
  status: MatchStatus;
  confidence: number;
  evidence: EvidenceBreakdown;
  explanation: string;
  exceptionType: ExceptionType;
  financialExposurePaise: number;
  aiAnalysis?: AiExceptionAnalysis;
  reviewerDecision?: {
    action: 'APPROVED' | 'REJECTED' | 'FLAGGED';
    reviewer: string;
    reviewedAt: string;
    note?: string;
  };
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: 'SYSTEM_ENGINE' | 'FINANCE_REVIEWER' | 'ADMIN';
  action:
    | 'AUTO_RECONCILE'
    | 'MANUAL_APPROVE'
    | 'MANUAL_REJECT'
    | 'INVESTIGATION_FLAG'
    | 'BATCH_RUN'
    | 'THRESHOLD_UPDATE';
  entityIds: {
    paymentId?: string;
    settlementId?: string;
    bankTransactionId?: string;
    batchId?: string;
  };
  previousState: string;
  newState: string;
  evidence: Record<string, unknown>;
  confidence: number;
  reason: string;
  modelUsed: string;
  fallbackUsed: boolean;
  sequenceNumber?: number;
  prevHash?: string;
  eventHash?: string;
}

export interface EngineConfig {
  highConfidenceThreshold: number; // e.g. 85 (>= 85 auto reconciles)
  mediumConfidenceThreshold: number; // e.g. 50 (50-84 review)
  maxDateDeltaDays: number; // e.g. 3 days
  feeTolerancePaise: number; // e.g. 0 (exact match) or 100 paise
  circuitBreakerThresholdPercent: number; // e.g. 25% anomaly triggers stop
  dryRun: boolean; // default true
}

export interface ErrorInspectionItem {
  paymentId: string;
  grossAmountPaise: number;
  predictedOutcome: MatchStatus;
  expectedOutcome: ExpectedOutcome;
  predictedSettlementId: string | null;
  expectedSettlementId: string | null;
  predictedBankTransactionId: string | null;
  expectedBankTransactionId: string | null;
  predictedExceptionType: ExceptionType;
  expectedExceptionType: ExceptionType;
  confidence: number;
  errorClassification: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'EXCEPTION_MISCLASSIFICATION';
  explanation: string;
  monetaryExposurePaise: number;
}

export interface EvaluationMetrics {
  totalRecordsProcessed: number;

  // 1. Proposed-Pair Metrics (Entity Matching Correctness)
  proposedPairPrecision: number; // Correct proposed pairs / Total proposed pairs
  proposedPairRecall: number; // Correct proposed pairs / Total expected pairs in ground truth
  totalProposedPairs: number;
  correctProposedPairs: number;
  totalExpectedPairs: number;

  // 2. Auto-Resolution Safety Metrics (Workflow Correctness)
  autoResolutionPrecision: number; // Valid safe auto-reconciled / Total auto-reconciled
  autoResolutionRecall: number; // Correctly auto-reconciled / Total expected auto-safe
  totalAutoReconciled: number;
  correctAutoReconciled: number;
  totalExpectedAutoSafe: number;

  // 3. Review-Routing Metric
  reviewRoutingAccuracy: number; // Correctly routed to review / Total expected review cases
  totalExpectedReview: number;
  correctReviewRouted: number;

  // 4. Exception Classification Accuracy
  exceptionDetectionAccuracy: number;
  correctExceptionCount: number;

  // 5. Financial & Safety Impact
  falsePositiveCount: number;
  falsePositiveExposurePaise: number; // Total rupee value of unsafe auto-matches
  totalGrossAmountPaise: number;
  matchedAmountPaise: number;
  amountCoverageRate: number;
  totalFinancialExposurePaise: number;

  // Standard legacy aliases
  precision: number;
  recall: number;
  f1Score: number;
  autoReconciledCount: number;
  autoReconciliationRate: number;
  manualReviewCount: number;
  manualReviewRate: number;
  exceptionCount: number;

  processingDurationMs: number;
  errors: ErrorInspectionItem[];
}

export interface BatchReconciliationResult {
  batchId: string;
  executedAt: string;
  config: EngineConfig;
  circuitBreakerTriggered: boolean;
  circuitBreakerReason?: string;
  records: ReconciliationRecord[];
  auditEvents: AuditEvent[];
  evaluation?: EvaluationMetrics;
}

export interface SeedBenchmarkResult {
  seed: number;
  label: string;
  totalRecords: number;
  proposedPairPrecision: number;
  proposedPairRecall: number;
  autoResolutionPrecision: number;
  autoResolutionRecall: number;
  reviewRoutingAccuracy: number;
  exceptionAccuracy: number;
  autoReconciliationRate: number;
  falsePositiveExposurePaise: number;
  processingDurationMs: number;
}

export interface PolicySimulationResult {
  highThreshold: number;
  mediumThreshold: number;
  autoReconciledCount: number;
  autoReconciliationRate: number;
  reviewCount: number;
  reviewRate: number;
  exceptionCount: number;
  exceptionRate: number;
  autoResolutionPrecision: number;
  autoResolutionRecall: number;
  reviewRoutingAccuracy: number;
  falsePositiveCount: number;
  falsePositiveExposurePaise: number;
  evaluation: EvaluationMetrics;
  isValid: boolean;
  validationError?: string;
}

export interface OperationalDecisionResult {
  updatedRecords: ReconciliationRecord[];
  updatedAuditEvents: AuditEvent[];
  modifiedRecord: ReconciliationRecord | undefined;
  newEvent: AuditEvent;
}

export interface PolicyProfile {
  id: string;
  name: string;
  tag: string;
  description: string;
  highThreshold: number;
  mediumThreshold: number;
}

export const STANDARD_POLICY_PROFILES: PolicyProfile[] = [
  {
    id: 'strict',
    name: 'Strict (High Confidence)',
    tag: 'Max Caution',
    description: 'Requires 95% confidence for automated matching. Maximizes controller review.',
    highThreshold: 95,
    mediumThreshold: 70,
  },
  {
    id: 'conservative',
    name: 'Conservative (Cautious)',
    tag: 'High Assurance',
    description: 'Requires 90% confidence for automated matching. Suitable for high-value merchants.',
    highThreshold: 90,
    mediumThreshold: 60,
  },
  {
    id: 'balanced',
    name: 'Balanced (Default Baseline)',
    tag: 'Engine Baseline',
    description: 'Standard 85/50 calibration balancing automated throughput with safety gates.',
    highThreshold: 85,
    mediumThreshold: 50,
  },
  {
    id: 'aggressive',
    name: 'Aggressive (High Clearing)',
    tag: 'High Yield',
    description: 'Lower 75% auto threshold for high-volume, low-exposure microtransactions.',
    highThreshold: 75,
    mediumThreshold: 40,
  },
];


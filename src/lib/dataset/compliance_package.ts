/**
 * Compliance & Audit Package Generator for ShaRecon AI
 * Bundles batch records, append-only audit trail, evaluation metrics,
 * and SHA-256 session integrity digest into a standardized audit package.
 */

import {
  BatchReconciliationResult,
  EngineConfig,
  ReconciliationRecord,
  AuditEvent,
} from '@/types/reconciliation';
import { canonicalJson, computeDeterministicDigest } from './digest';
export { computeDeterministicDigest } from './digest';

export interface CompliancePackageManifest {
  packageVersion: '2.0.0';
  packageId: string;
  generatedAt: string;
  system: {
    name: string;
    track: string;
    version: string;
    environment: string;
  };
  batchSummary: {
    batchId: string;
    executedAt?: string;
    totalRecords: number;
    processingDurationMs: number;
    currency: string;
    currencyUnit: string;
  };
  integrityAttestation: {
    sha256Digest: string;
    digestAlgorithm: 'SHA-256';
    digestEncoding: 'canonical-json-v1';
    scoringModel: {
      referenceMatchPoints: number;
      amountCompatibilityPoints: number;
      dateProximityPoints: number;
      utrDescriptionSimilarityPoints: number;
      maxScore: number;
    };
    engineConfig: EngineConfig;
  };
  evaluationMetrics?: {
    proposedPairPrecision: number;
    proposedPairRecall: number;
    autoResolutionPrecision: number;
    autoResolutionRecall: number;
    reviewRoutingAccuracy: number;
    exceptionDetectionAccuracy: number;
    falsePositiveCount: number;
    falsePositiveExposurePaise: number;
  };
  reconciliationLedger: {
    recordCount: number;
    records: ReconciliationRecord[];
  };
  auditTrail: {
    eventCount: number;
    events: AuditEvent[];
  };
  complianceDisclaimers: {
    fundsMovement: string;
    auditStorageScope: string;
    explainabilityGuarantee: string;
  };
}

/**
 * Builds a complete compliance & audit manifest from an active batch result and configuration.
 */
export async function buildComplianceAuditPackage(
  batch: BatchReconciliationResult,
  config: EngineConfig
): Promise<CompliancePackageManifest> {
  batch = structuredClone(batch);
  config = structuredClone(config);
  const timestamp = new Date().toISOString();
  const packageId = `pkg_audit_${batch.batchId}_${Date.now()}`;

  const evalSummary = batch.evaluation
    ? {
        proposedPairPrecision: batch.evaluation.proposedPairPrecision,
        proposedPairRecall: batch.evaluation.proposedPairRecall,
        autoResolutionPrecision: batch.evaluation.autoResolutionPrecision,
        autoResolutionRecall: batch.evaluation.autoResolutionRecall,
        reviewRoutingAccuracy: batch.evaluation.reviewRoutingAccuracy,
        exceptionDetectionAccuracy: batch.evaluation.exceptionDetectionAccuracy,
        falsePositiveCount: batch.evaluation.falsePositiveCount,
        falsePositiveExposurePaise: batch.evaluation.falsePositiveExposurePaise,
      }
    : undefined;

  const manifest: CompliancePackageManifest = {
    packageVersion: '2.0.0',
    packageId,
    generatedAt: timestamp,
    system: {
      name: 'ShaRecon AI',
      track: 'Razorpay AI Buildathon — AI Finance Controller',
      version: '0.1.0',
      environment: 'Client-Side Evaluation & Audit Controller',
    },
    batchSummary: {
      batchId: batch.batchId,
      executedAt: batch.executedAt,
      totalRecords: batch.records.length,
      processingDurationMs: batch.evaluation?.processingDurationMs ?? 0,
      currency: 'INR',
      currencyUnit: 'Integer Paise (1 INR = 100 paise)',
    },
    integrityAttestation: {
      sha256Digest: '',
      digestAlgorithm: 'SHA-256',
      digestEncoding: 'canonical-json-v1',
      scoringModel: {
        referenceMatchPoints: 40,
        amountCompatibilityPoints: 35,
        dateProximityPoints: 15,
        utrDescriptionSimilarityPoints: 10,
        maxScore: 100,
      },
      engineConfig: config,
    },
    evaluationMetrics: evalSummary,
    reconciliationLedger: {
      recordCount: batch.records.length,
      records: batch.records,
    },
    auditTrail: {
      eventCount: batch.auditEvents.length,
      events: batch.auditEvents,
    },
    complianceDisclaimers: {
      fundsMovement:
        'ShaRecon AI is an explainable decision support tool. It does not move funds or execute direct banking transfers.',
      auditStorageScope:
        'The audit trail is append-only during the current session. Enterprise production deployments require persistent durable ledger storage.',
      explainabilityGuarantee:
        'All confidence scores and resolution decisions are mathematically derived from 4-factor evidence with zero AI hallucinations overriding thresholds.',
    },
  };
  manifest.integrityAttestation.sha256Digest = await computeDeterministicDigest(packagePayload(manifest));
  return manifest;
}

/**
 * Triggers a browser download of the compliance package as a formatted JSON file.
 */
export async function downloadCompliancePackage(
  batch: BatchReconciliationResult,
  config: EngineConfig
): Promise<void> {
  const pkg = await buildComplianceAuditPackage(batch, config);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sharecon_compliance_audit_package_${batch.batchId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The digest covers every exported field except the digest itself. */
function packagePayload(manifest: CompliancePackageManifest): string {
  const integrityAttestation = { ...manifest.integrityAttestation, sha256Digest: undefined };
  return canonicalJson({ ...manifest, integrityAttestation });
}
export async function verifyComplianceAuditPackage(manifest: CompliancePackageManifest): Promise<boolean> {
  if (manifest.packageVersion !== '2.0.0' || manifest.integrityAttestation.digestAlgorithm !== 'SHA-256' ||
      manifest.integrityAttestation.digestEncoding !== 'canonical-json-v1') return false;
  return /^[a-f0-9]{64}$/.test(manifest.integrityAttestation.sha256Digest) &&
    manifest.integrityAttestation.sha256Digest === await computeDeterministicDigest(packagePayload(manifest));
}

'use client';

import React, { useState } from 'react';
import {
  Layers,
  FileCheck2,
  AlertTriangle,
  History,
  BarChart3,
} from 'lucide-react';
import {
  BatchReconciliationResult,
  EngineConfig,
  ReconciliationRecord,
  GroundTruth,
  Payment,
  Settlement,
  BankTransaction,
  AuditEvent,
} from '@/types/reconciliation';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { evaluateReconciliation } from '@/lib/engine/evaluator';
import { Header } from '@/components/Header';
import { KpiSummary } from '@/components/KpiSummary';
import { OverviewTab } from '@/components/OverviewTab';
import { ReconciliationTab } from '@/components/ReconciliationTab';
import { ExceptionsTab } from '@/components/ExceptionsTab';
import { AuditTab } from '@/components/AuditTab';
import { EvaluationTab } from '@/components/EvaluationTab';
import { MatchDetailDrawer } from '@/components/MatchDetailDrawer';
import { SettingsModal } from '@/components/SettingsModal';
import { CsvUploadModal } from '@/components/CsvUploadModal';

export default function Home() {
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_ENGINE_CONFIG);
  const [groundTruth, setGroundTruth] = useState<GroundTruth[]>(() => {
    const dataset = generateSyntheticDataset(42);
    return dataset.groundTruth;
  });

  const [batch, setBatch] = useState<BatchReconciliationResult | null>(() => {
    const start = performance.now();
    const dataset = generateSyntheticDataset(42);
    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      DEFAULT_ENGINE_CONFIG
    );
    const duration = performance.now() - start;
    result.evaluation = evaluateReconciliation(result.records, dataset.groundTruth, duration);
    return result;
  });

  const [activeTab, setActiveTab] = useState<
    'overview' | 'reconciliation' | 'exceptions' | 'audit' | 'evaluation'
  >('overview');

  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const handleLoadDemo = () => {
    setIsReconciling(true);
    const start = performance.now();
    const dataset = generateSyntheticDataset(42);
    setGroundTruth(dataset.groundTruth);

    const result = reconcileBatch(
      dataset.payments,
      dataset.settlements,
      dataset.bankTransactions,
      config
    );

    const duration = performance.now() - start;
    const evaluation = evaluateReconciliation(result.records, dataset.groundTruth, duration);
    result.evaluation = evaluation;

    setBatch(result);
    setIsReconciling(false);
  };

  const handleUpdateConfig = (newConfig: EngineConfig) => {
    setConfig(newConfig);
    if (!batch) return;

    // Re-score existing batch with updated thresholds
    const payments = batch.records.map((r) => r.payment);
    const settlements = batch.records
      .map((r) => r.matchedSettlement)
      .filter((s): s is Settlement => Boolean(s));
    const bankTx = batch.records
      .map((r) => r.matchedBankTransaction)
      .filter((b): b is BankTransaction => Boolean(b));

    const start = performance.now();
    const result = reconcileBatch(payments, settlements, bankTx, newConfig, batch.auditEvents);
    const duration = performance.now() - start;

    if (groundTruth.length > 0) {
      result.evaluation = evaluateReconciliation(result.records, groundTruth, duration);
    }

    setBatch(result);
  };

  const handleReviewDecision = (
    recordId: string,
    action: 'APPROVED' | 'REJECTED' | 'FLAGGED',
    note?: string
  ) => {
    if (!batch) return;

    const now = new Date().toISOString();
    const updatedRecords = batch.records.map((r) => {
      if (r.recordId === recordId) {
        const newStatus =
          action === 'APPROVED'
            ? 'MANUALLY_APPROVED'
            : action === 'REJECTED'
            ? 'MANUALLY_REJECTED'
            : r.status;

        return {
          ...r,
          status: newStatus,
          reviewerDecision: {
            action,
            reviewer: 'Finance Operations Lead',
            reviewedAt: now,
            note: note || 'Approved following review of supporting financial evidence.',
          },
        };
      }
      return r;
    });

    const targetRecord = batch.records.find((r) => r.recordId === recordId);
    const newAuditEvent: AuditEvent = {
      eventId: `aud_rev_${Date.now()}_${recordId}`,
      timestamp: now,
      actor: 'FINANCE_REVIEWER',
      action: action === 'APPROVED' ? 'MANUAL_APPROVE' : 'MANUAL_REJECT',
      entityIds: {
        paymentId: recordId,
        settlementId: targetRecord?.matchedSettlement?.settlementId,
        bankTransactionId: targetRecord?.matchedBankTransaction?.bankTransactionId,
      },
      previousState: targetRecord?.status || 'PENDING_REVIEW',
      newState: action === 'APPROVED' ? 'MANUALLY_APPROVED' : 'MANUALLY_REJECTED',
      evidence: {
        note: note || '',
        originalConfidence: targetRecord?.confidence,
        exceptionType: targetRecord?.exceptionType,
      },
      confidence: targetRecord?.confidence || 0,
      reason: note || `Human controller decision: ${action}`,
      modelUsed: 'Human-In-The-Loop',
      fallbackUsed: false,
    };

    const updatedAuditEvents = [newAuditEvent, ...batch.auditEvents];
    const evaluation = evaluateReconciliation(
      updatedRecords,
      groundTruth,
      batch.evaluation?.processingDurationMs || 0
    );

    setBatch({
      ...batch,
      records: updatedRecords,
      auditEvents: updatedAuditEvents,
      evaluation,
    });

    // Update selected record in drawer if open
    if (selectedRecord && selectedRecord.recordId === recordId) {
      const updated = updatedRecords.find((r) => r.recordId === recordId);
      if (updated) setSelectedRecord(updated);
    }
  };

  const handleQuickApprove = (recordId: string) => {
    handleReviewDecision(recordId, 'APPROVED', 'Quick approved from workspace queue.');
  };

  const handleQuickReject = (recordId: string) => {
    handleReviewDecision(recordId, 'REJECTED', 'Quick rejected: variance exceeds acceptable policy.');
  };

  const handleAnalyzeException = async (record: ReconciliationRecord) => {
    setIsAnalyzingAi(true);
    try {
      const response = await fetch('/api/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      });

      const data = await response.json();
      if (data.success && data.analysis && batch) {
        const updatedRecords = batch.records.map((r) =>
          r.recordId === record.recordId ? { ...r, aiAnalysis: data.analysis } : r
        );

        setBatch({
          ...batch,
          records: updatedRecords,
        });

        if (selectedRecord && selectedRecord.recordId === record.recordId) {
          setSelectedRecord({ ...selectedRecord, aiAnalysis: data.analysis });
        }
      }
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleUploadSuccess = (
    payments: Payment[],
    settlements: Settlement[],
    bankTx: BankTransaction[]
  ) => {
    setIsReconciling(true);
    const result = reconcileBatch(payments, settlements, bankTx, config);

    // Ground truth may not exist for custom uploads
    setGroundTruth([]);
    setBatch(result);
    setIsReconciling(false);
  };

  const handleExportReports = () => {
    if (!batch) return;

    // Export full reconciliation CSV
    const rows = batch.records.map((r) => ({
      paymentId: r.payment.paymentId,
      orderId: r.payment.orderId,
      grossAmountINR: (r.payment.grossAmount / 100).toFixed(2),
      expectedNetINR: (r.payment.expectedNetAmount / 100).toFixed(2),
      settlementId: r.matchedSettlement?.settlementId || 'N/A',
      settledAmountINR: r.matchedSettlement
        ? (r.matchedSettlement.settledAmount / 100).toFixed(2)
        : '0.00',
      settlementUtr: r.matchedSettlement?.utr || 'N/A',
      bankTxId: r.matchedBankTransaction?.bankTransactionId || 'N/A',
      bankCreditINR: r.matchedBankTransaction
        ? (r.matchedBankTransaction.creditAmount / 100).toFixed(2)
        : '0.00',
      matchStatus: r.status,
      confidenceScore: r.confidence,
      exceptionType: r.exceptionType,
      explanation: r.explanation,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        Object.keys(rows[0]).join(','),
        ...rows.map((row) =>
          Object.values(row)
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sharecon_reconciliation_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAuditJson = () => {
    if (!batch) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(batch.auditEvents, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `sharecon_audit_trail_${Date.now()}.json`;
    link.click();
  };

  const handleDownloadAuditCsv = () => {
    if (!batch || batch.auditEvents.length === 0) return;
    const rows = batch.auditEvents.map((ev) => ({
      eventId: ev.eventId,
      timestamp: ev.timestamp,
      actor: ev.actor,
      action: ev.action,
      paymentId: ev.entityIds.paymentId || '',
      settlementId: ev.entityIds.settlementId || '',
      previousState: ev.previousState,
      newState: ev.newState,
      confidence: ev.confidence,
      reason: ev.reason,
      modelUsed: ev.modelUsed,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        Object.keys(rows[0]).join(','),
        ...rows.map((row) =>
          Object.values(row)
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sharecon_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setBatch(null);
    setGroundTruth([]);
    setSelectedRecord(null);
  };

  const reviewQueueCount =
    batch?.records.filter((r) => r.status === 'PENDING_REVIEW').length || 0;
  const exceptionCount =
    batch?.records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <Header
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onLoadDemo={handleLoadDemo}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportReports={handleExportReports}
        onReset={handleReset}
        totalRecords={batch?.records.length || 0}
        circuitBreakerTriggered={batch?.circuitBreakerTriggered || false}
        circuitBreakerReason={batch?.circuitBreakerReason}
        isReconciling={isReconciling}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Metric Summary Cards */}
        <KpiSummary
          metrics={batch?.evaluation}
          totalRecords={batch?.records.length || 0}
        />

        {/* Tab Navigation */}
        {batch && batch.records.length > 0 && (
          <div className="border-b border-slate-200 mb-6 flex items-center justify-between">
            <nav className="flex space-x-1 sm:space-x-4 -mb-px text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'reconciliation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Reconciliation Workspace</span>
                {reviewQueueCount > 0 && (
                  <span className="ml-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {reviewQueueCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('exceptions')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'exceptions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Exception Queue</span>
                {exceptionCount > 0 && (
                  <span className="ml-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {exceptionCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'audit'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Trail</span>
              </button>

              <button
                onClick={() => setActiveTab('evaluation')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'evaluation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Evaluation & Ground Truth</span>
              </button>
            </nav>
          </div>
        )}

        {/* Tab Views */}
        {batch && (
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                batch={batch}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'reconciliation' && (
              <ReconciliationTab
                records={batch.records}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onQuickApprove={handleQuickApprove}
                onQuickReject={handleQuickReject}
              />
            )}

            {activeTab === 'exceptions' && (
              <ExceptionsTab
                records={batch.records}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onQuickApprove={handleQuickApprove}
                onQuickReject={handleQuickReject}
                onAnalyzeException={handleAnalyzeException}
                isAnalyzingAi={isAnalyzingAi}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTab
                auditEvents={batch.auditEvents}
                onDownloadAuditJson={handleDownloadAuditJson}
                onDownloadAuditCsv={handleDownloadAuditCsv}
              />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationTab evaluation={batch.evaluation} />
            )}
          </div>
        )}
      </main>

      {/* Slide-Out 3-Way Match Drawer */}
      <MatchDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onReviewDecision={handleReviewDecision}
        onAnalyzeException={handleAnalyzeException}
        isAnalyzingAi={isAnalyzingAi}
      />

      {/* Engine Settings Modal */}
      <SettingsModal
        config={config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleUpdateConfig}
      />

      {/* CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            ShaRecon AI — Built for Razorpay AI Buildathon (AI Finance Controller Track)
          </span>
          <span className="text-[11px] text-slate-400">
            All transaction records and settlement amounts are synthetic simulations.
          </span>
        </div>
      </footer>
    </div>
  );
}

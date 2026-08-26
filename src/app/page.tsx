'use client';

import React, { useState } from 'react';
import {
  BatchReconciliationResult,
  ReconciliationRecord,
  EngineConfig,
  GroundTruth,
  Payment,
  Settlement,
  BankTransaction,
} from '@/types/reconciliation';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { reconcileBatch, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/matcher';
import { evaluateReconciliation } from '@/lib/engine/evaluator';
import { applyReviewerDecision } from '@/lib/engine/operations';
import { exportReconciliationCsv, exportAuditEventsCsv } from '@/lib/dataset/csv';
import { downloadCompliancePackage } from '@/lib/dataset/compliance_package';

// Components
import { NavigationRail, WorkspaceTab } from '@/components/NavigationRail';
import { TopCommandBar } from '@/components/TopCommandBar';
import { ControlCenterTab } from '@/components/ControlCenterTab';
import { ReconciliationTab } from '@/components/ReconciliationTab';
import { ExceptionsTab } from '@/components/ExceptionsTab';
import { AuditTab } from '@/components/AuditTab';
import { EvaluationLabTab } from '@/components/EvaluationLabTab';
import { MethodologyTab } from '@/components/MethodologyTab';
import { HelpTab } from '@/components/HelpTab';
import { MatchDetailDrawer } from '@/components/MatchDetailDrawer';
import { SettingsModal } from '@/components/SettingsModal';
import { CsvUploadModal } from '@/components/CsvUploadModal';
import { CommandPaletteModal } from '@/components/CommandPaletteModal';
import { GuidedDemoTour } from '@/components/GuidedDemoTour';
import { LiveRunnerModal } from '@/components/LiveRunnerModal';
import { ToastProvider, useToast } from '@/components/Toast';

function DashboardContent() {
  const { showToast } = useToast();

  const [config, setConfig] = useState<EngineConfig>(DEFAULT_ENGINE_CONFIG);
  const [groundTruth, setGroundTruth] = useState<GroundTruth[]>(() => {
    const dataset = generateSyntheticDataset(42);
    return dataset.groundTruth;
  });

  const [rawStatements, setRawStatements] = useState<{
    payments: Payment[];
    settlements: Settlement[];
    bankTransactions: BankTransaction[];
  }>(() => {
    const dataset = generateSyntheticDataset(42);
    return {
      payments: dataset.payments,
      settlements: dataset.settlements,
      bankTransactions: dataset.bankTransactions,
    };
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

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('control_center');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isLiveRunnerOpen, setIsLiveRunnerOpen] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // Load / Reload Demo Benchmark Dataset (Seed 42)
  const handleLoadDemo = () => {
    setIsReconciling(true);
    const start = performance.now();
    const dataset = generateSyntheticDataset(42);
    setRawStatements({
      payments: dataset.payments,
      settlements: dataset.settlements,
      bankTransactions: dataset.bankTransactions,
    });
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
    showToast({
      type: 'success',
      title: 'Demo Dataset Processed',
      description: 'Loaded 180 synthetic multi-leg transactions across 14 financial edge cases.',
    });
  };

  // Threshold update
  const handleUpdateConfig = (newConfig: EngineConfig) => {
    setConfig(newConfig);
    if (!batch) return;

    const start = performance.now();
    const result = reconcileBatch(
      rawStatements.payments,
      rawStatements.settlements,
      rawStatements.bankTransactions,
      newConfig,
      batch.auditEvents
    );
    const duration = performance.now() - start;

    if (groundTruth.length > 0) {
      result.evaluation = evaluateReconciliation(result.records, groundTruth, duration);
    }

    setBatch(result);
    showToast({
      type: 'info',
      title: 'Configuration Updated',
      description: `Confidence threshold set to ${newConfig.highConfidenceThreshold}%. Dry-run: ${newConfig.dryRun ? 'Active' : 'Off'}.`,
    });
  };

  // Reviewer decisions (Approve, Reject, Flag)
  const handleReviewDecision = (
    recordId: string,
    action: 'APPROVED' | 'REJECTED' | 'FLAGGED',
    note?: string
  ) => {
    if (!batch) return;

    const decisionResult = applyReviewerDecision(
      batch.records,
      batch.auditEvents,
      recordId,
      action,
      'Finance Operations Lead',
      note
    );

    // Preserves the immutable baseline engine benchmark across reviewer decisions
    setBatch({
      ...batch,
      records: decisionResult.updatedRecords,
      auditEvents: decisionResult.updatedAuditEvents,
    });

    // Update selected record in drawer if open
    if (selectedRecord && selectedRecord.recordId === recordId) {
      if (decisionResult.modifiedRecord) {
        setSelectedRecord(decisionResult.modifiedRecord);
      }
    }

    showToast({
      type: action === 'APPROVED' ? 'success' : action === 'REJECTED' ? 'error' : 'warning',
      title: `Record ${action.toLowerCase()}`,
      description: `${recordId} state updated. Recorded in immutable audit log.`,
    });
  };

  // Quick action helpers
  const handleQuickApprove = (recordId: string) => {
    handleReviewDecision(recordId, 'APPROVED', 'Quick approved from workspace queue.');
  };

  const handleQuickReject = (recordId: string) => {
    handleReviewDecision(recordId, 'REJECTED', 'Quick rejected from workspace queue.');
  };

  // AI Exception Analysis
  const handleAnalyzeException = async (record: ReconciliationRecord) => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      });

      const data = await res.json();
      if (data.success && data.analysis && batch) {
        const updatedRecords = batch.records.map((r) =>
          r.recordId === record.recordId ? { ...r, aiAnalysis: data.analysis } : r
        );

        setBatch({ ...batch, records: updatedRecords });
        if (selectedRecord && selectedRecord.recordId === record.recordId) {
          setSelectedRecord({ ...selectedRecord, aiAnalysis: data.analysis });
        }

        showToast({
          type: 'info',
          title: 'Exception Diagnosed',
          description: `Analysis completed using [${data.analysis.modelUsed}].`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Analysis Failed',
          description: data.error || 'Unable to diagnose exception.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Network Error',
        description: 'Failed to contact exception analysis server.',
      });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Custom CSV Upload Handler
  const handleUploadSuccess = (
    payments: Payment[],
    settlements: Settlement[],
    bankTx: BankTransaction[]
  ) => {
    setIsReconciling(true);
    setRawStatements({ payments, settlements, bankTransactions: bankTx });
    setGroundTruth([]);
    const start = performance.now();
    const result = reconcileBatch(payments, settlements, bankTx, config);
    const duration = performance.now() - start;
    result.evaluation = evaluateReconciliation(result.records, [], duration);

    setBatch(result);
    setIsReconciling(false);
    showToast({
      type: 'success',
      title: 'Custom Statements Reconciled',
      description: `Processed ${payments.length} payments, ${settlements.length} settlements, and ${bankTx.length} bank credits.`,
    });
  };

  // Export handlers
  const handleExportReports = () => {
    if (!batch) return;
    const csv = exportReconciliationCsv(batch.records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharecon_reconciliation_${batch.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Report Exported',
      description: 'Downloaded reconciliation CSV report.',
    });
  };

  const handleDownloadAuditJson = () => {
    if (!batch) return;
    const jsonStr = JSON.stringify(batch.auditEvents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharecon_audit_${batch.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Audit JSON Exported',
      description: 'Downloaded complete audit event stream in JSON format.',
    });
  };

  const handleDownloadAuditCsv = () => {
    if (!batch) return;
    const csv = exportAuditEventsCsv(batch.auditEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharecon_audit_${batch.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Audit CSV Exported',
      description: 'Downloaded compliance audit logs in CSV format.',
    });
  };

  const handleDownloadCompliancePackage = () => {
    if (!batch) return;
    downloadCompliancePackage(batch, config);
    showToast({
      type: 'success',
      title: 'Compliance Package Exported',
      description: 'Downloaded complete compliance & audit manifest bundle.',
    });
  };

  // Reset workspace
  const handleReset = () => {
    setBatch(null);
    setGroundTruth([]);
    setRawStatements({ payments: [], settlements: [], bankTransactions: [] });
    setSelectedRecord(null);
    showToast({
      type: 'info',
      title: 'Workspace Cleared',
      description: 'All active records and session audit logs have been reset.',
    });
  };

  // Operational counts
  const pendingReviewCount = batch
    ? batch.records.filter((r) => r.status === 'PENDING_REVIEW').length
    : 0;
  const exceptionCount = batch
    ? batch.records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length
    : 0;

  return (
    <div className="min-h-screen app-canvas text-[#f8fafc] font-sans antialiased flex flex-col overflow-x-hidden max-w-full">
      {/* Left Navigation Rail (Desktop & Mobile Drawer) */}
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed((prev) => !prev)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        pendingReviewCount={pendingReviewCount}
        exceptionCount={exceptionCount}
      />

      {/* Main Content Area (Offset by Rail width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isNavCollapsed ? 'lg:pl-18' : 'lg:pl-64'
        }`}
      >
        {/* Top Command Bar */}
        <TopCommandBar
          config={config}
          totalRecords={batch ? batch.records.length : 0}
          isReconciling={isReconciling}
          onToggleNavigation={() => setIsMobileNavOpen((prev) => !prev)}
          onUpdateConfig={handleUpdateConfig}
          onLoadDemo={handleLoadDemo}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onStartTour={() => setIsTourOpen(true)}
          onExportReports={handleExportReports}
          onReset={handleReset}
        />

        {/* Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'control_center' && (
            <ControlCenterTab
              batch={batch}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onOpenLiveRunner={() => setIsLiveRunnerOpen(true)}
            />
          )}

          {activeTab === 'reconciliation' && (
            <ReconciliationTab
              records={batch ? batch.records : []}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
            />
          )}

          {activeTab === 'exceptions' && (
            <ExceptionsTab
              records={batch ? batch.records : []}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
              onAnalyzeException={handleAnalyzeException}
              isAnalyzingAi={isAnalyzingAi}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTab
              auditEvents={batch ? batch.auditEvents : []}
              onDownloadAuditJson={handleDownloadAuditJson}
              onDownloadAuditCsv={handleDownloadAuditCsv}
              onDownloadCompliancePackage={handleDownloadCompliancePackage}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationLabTab
              evaluation={batch?.evaluation}
              records={batch ? batch.records : []}
              groundTruth={groundTruth}
              payments={rawStatements.payments}
              settlements={rawStatements.settlements}
              bankTransactions={rawStatements.bankTransactions}
            />
          )}

          {activeTab === 'methodology' && <MethodologyTab />}

          {activeTab === 'help' && (
            <HelpTab
              onNavigateTab={(tab) => setActiveTab(tab)}
              onStartTour={() => setIsTourOpen(true)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-[#080c14] border-t border-white/8 py-3.5 mt-12 text-center text-xs text-[#64748b]">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[#94a3b8]">
              <strong className="text-[#f8fafc]">ShaRecon AI</strong> — Built for Razorpay AI Buildathon (AI Finance Controller Track)
            </span>
            <span className="text-[11px] text-[#64748b]">
              Evaluated using synthetic simulations. Zero live money movement.
            </span>
          </div>
        </footer>
      </div>

      {/* Slide-Out 3-Way Evidence Drawer */}
      <MatchDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onReviewDecision={handleReviewDecision}
        onAnalyzeAi={handleAnalyzeException}
        isAnalyzingAi={isAnalyzingAi}
      />

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLoadDemo={handleLoadDemo}
        onOpenUpload={() => setIsUploadOpen(true)}
        onToggleDryRun={() => handleUpdateConfig({ ...config, dryRun: !config.dryRun })}
        onExportReports={handleExportReports}
        onStartTour={() => setIsTourOpen(true)}
        records={batch ? batch.records : []}
        onSelectRecord={(rec) => setSelectedRecord(rec)}
      />

      {/* Guided Judge Demo Walkthrough */}
      <GuidedDemoTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Threshold Configuration Modal */}
      <SettingsModal
        config={config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleUpdateConfig}
      />

      {/* 3-Way CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Live Reconciliation Runner Modal */}
      <LiveRunnerModal
        isOpen={isLiveRunnerOpen}
        onClose={() => setIsLiveRunnerOpen(false)}
        batch={batch}
        onComplete={() => setActiveTab('reconciliation')}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}

'use client';

import React from 'react';
import {
  ShieldCheck,
  Play,
  Upload,
  Download,
  RotateCcw,
  Sliders,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import { EngineConfig } from '@/types/reconciliation';

interface HeaderProps {
  config: EngineConfig;
  onUpdateConfig: (newConfig: EngineConfig) => void;
  onLoadDemo: () => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onExportReports: () => void;
  onReset: () => void;
  totalRecords: number;
  circuitBreakerTriggered: boolean;
  circuitBreakerReason?: string;
  isReconciling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onUpdateConfig,
  onLoadDemo,
  onOpenUpload,
  onOpenSettings,
  onExportReports,
  onReset,
  totalRecords,
  circuitBreakerTriggered,
  circuitBreakerReason,
  isReconciling,
}) => {
  const toggleDryRun = () => {
    onUpdateConfig({
      ...config,
      dryRun: !config.dryRun,
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {circuitBreakerTriggered && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Circuit Breaker Triggered:</strong> {circuitBreakerReason}
            </span>
          </div>
          <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded text-[11px] font-semibold">
            AUTOMATED RECONCILIATION HALTED
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold tracking-tight">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                ShaRecon <span className="text-blue-600 font-extrabold">AI</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                AI Finance Controller
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Razorpay Buildathon
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Explainable reconciliation. Confident financial control.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Dry Run Toggle */}
          <button
            onClick={toggleDryRun}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              config.dryRun
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="When Dry-Run is enabled, no live ledger commitments are finalized."
          >
            {config.dryRun ? (
              <>
                <ToggleRight className="w-4 h-4 text-amber-600" />
                <span>Dry-Run: <strong>Active</strong></span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-emerald-600" />
                <span>Live Mode: <strong>Active</strong></span>
              </>
            )}
          </button>

          {/* Engine Settings */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Configure confidence thresholds and fee tolerance"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Thresholds</span>
          </button>

          {/* Load Demo */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{totalRecords > 0 ? 'Reload Demo (180)' : 'Load Demo Dataset'}</span>
          </button>

          {/* Upload CSVs */}
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload CSVs</span>
          </button>

          {/* Export Reports */}
          {totalRecords > 0 && (
            <button
              onClick={onExportReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Download reconciliation, exceptions, and audit reports"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Reset */}
          {totalRecords > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear all records and reset workspace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

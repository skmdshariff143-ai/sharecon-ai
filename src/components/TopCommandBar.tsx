import React from 'react';
import {
  Menu,
  Play,
  Upload,
  Download,
  RotateCcw,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Search,
  Bot,
} from 'lucide-react';
import { EngineConfig } from '@/types/reconciliation';

interface TopCommandBarProps {
  config: EngineConfig;
  totalRecords: number;
  isReconciling: boolean;
  onToggleNavigation: () => void;
  onUpdateConfig: (newConfig: EngineConfig) => void;
  onLoadDemo: () => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  onStartTour: () => void;
  onExportReports: () => void;
  onReset: () => void;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  config,
  totalRecords,
  isReconciling,
  onToggleNavigation,
  onUpdateConfig,
  onLoadDemo,
  onOpenUpload,
  onOpenSettings,
  onOpenCommandPalette,
  onStartTour,
  onExportReports,
  onReset,
}) => {
  const toggleDryRun = () => {
    onUpdateConfig({
      ...config,
      dryRun: !config.dryRun,
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button & Dataset Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleNavigation}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Dataset: <strong>Synthetic Multi-Leg</strong></span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-900 font-bold">{totalRecords}</span> records
          </div>

          {/* AI / Fallback Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-medium border border-violet-200/80">
            <Bot className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden md:inline">Gemini Analyst:</span>
            <span className="font-semibold">Advisory + Fallback Ready</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            title="Open Command Palette (Ctrl+K or ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search / Commands</span>
            <kbd className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Guided Tour Trigger */}
          <button
            onClick={onStartTour}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer shadow-2xs"
            title="Start interactive 8-step demo walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden sm:inline">Guided Demo</span>
          </button>

          {/* Dry-Run Toggle */}
          <button
            onClick={toggleDryRun}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              config.dryRun
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
          >
            {config.dryRun ? (
              <ToggleRight className="w-4 h-4 text-amber-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Dry-Run:</span>
            <strong>{config.dryRun ? 'Active' : 'Live'}</strong>
          </button>

          {/* Reload / Run Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isReconciling ? 'Reconciling...' : 'Run Demo (180)'}</span>
          </button>

          {/* Threshold Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            title="Configure confidence scoring thresholds and fee tolerances"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Upload CSVs Trigger */}
          <button
            onClick={onOpenUpload}
            className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            title="Upload custom 3-way statements (Payments, Settlements, Bank Transactions)"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Export Reports */}
          <button
            onClick={onExportReports}
            className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            title="Export reconciliation results and audit logs"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset Workspace */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear all records and reset workspace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

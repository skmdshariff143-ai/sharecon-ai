import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const toggleDryRun = () => {
    onUpdateConfig({
      ...config,
      dryRun: !config.dryRun,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <header className="surface-glass sticky top-0 z-30">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 max-w-full">
        {/* Left Side: Mobile Menu Button & Dataset Context */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleNavigation}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill (Full on md+, compact on sm) */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/90 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
            <span className="hidden md:inline text-slate-600">Dataset: <strong className="text-slate-800 font-semibold">Synthetic 3-Way</strong></span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="font-mono text-slate-900 font-bold tabular-nums">{totalRecords}</span> records
          </div>

          {/* AI / Fallback Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-medium border border-violet-200/80 shrink-0">
            <Bot className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="hidden xl:inline text-violet-800 font-medium">Gemini Analyst:</span>
            <span className="font-semibold text-[11px] sm:text-xs">Advisory + Fallback</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-50/90 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="Open Command Palette (Ctrl+K or ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Quick Jump</span>
            <kbd className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 shadow-xs">
              ⌘K
            </kbd>
          </button>

          {/* Guided Tour Trigger (Full on md+, icon on mobile/tablet) */}
          <button
            onClick={onStartTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shadow-xs shrink-0"
            title="Start interactive demo walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="hidden lg:inline">Guided Demo</span>
          </button>

          {/* Dry-Run Toggle (Desktop only; tablet/mobile access via More menu) */}
          <button
            onClick={toggleDryRun}
            className={`hidden md:inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
              config.dryRun
                ? 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100'
            }`}
            title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
          >
            {config.dryRun ? (
              <ToggleRight className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="hidden xl:inline">Dry-Run:</span>
            <strong>{config.dryRun ? 'Active' : 'Live'}</strong>
          </button>

          {/* Reload / Run Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>{isReconciling ? 'Reconciling...' : 'Run Demo (180)'}</span>
          </button>

          {/* Desktop Secondary Action Icons (lg+) */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Configure confidence scoring thresholds and fee tolerances"
              aria-label="Threshold Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenUpload}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Upload custom 3-way statements"
              aria-label="Upload CSVs"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={onExportReports}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Export reconciliation results and audit logs"
              aria-label="Export Reports"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear all records and reset workspace"
              aria-label="Reset Workspace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Responsive Overflow Dropdown Menu (<xl) */}
          <div className="relative xl:hidden" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="More actions and settings"
              aria-label="More actions"
              aria-expanded={isMoreOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-56 surface-modal rounded-xl shadow-xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                  Workspace Actions
                </div>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Command Palette (⌘K)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onStartTour();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Start Guided Tour</span>
                </button>

                <button
                  onClick={() => {
                    toggleDryRun();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    {config.dryRun ? (
                      <ToggleRight className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>Dry-Run Mode</span>
                  </span>
                  <span className="font-semibold text-[10px] font-mono uppercase text-slate-500">
                    {config.dryRun ? 'Active' : 'Live'}
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Threshold Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenUpload();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Statements (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onExportReports();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Reports</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onReset();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

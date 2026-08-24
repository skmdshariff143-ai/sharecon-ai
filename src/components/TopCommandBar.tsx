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
    <header className="surface-glass sticky top-0 z-30 border-b border-slate-200/80">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 max-w-full">
        {/* Left Side: Mobile Menu Button & Dataset Context */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleNavigation}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/90 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#098f74] shrink-0 shadow-[0_0_6px_rgba(9,143,116,0.6)]"></span>
            <span className="hidden md:inline text-slate-600">Dataset: <strong className="text-slate-900 font-semibold">Synthetic 3-Way</strong></span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="font-mono text-slate-900 font-bold tabular-nums">{totalRecords}</span> records
          </div>

          {/* AI / Fallback Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f1efff] text-[#6d28d9] text-xs font-medium border border-[#ddd6fe] shrink-0 shadow-xs">
            <Bot className="w-3.5 h-3.5 text-[#6d28d9] shrink-0" />
            <span className="hidden xl:inline text-[#5b21b6] font-medium">Gemini Analyst:</span>
            <span className="font-bold text-[11px] sm:text-xs">Advisory + Fallback</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-50/90 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer min-h-[38px] shadow-xs"
            title="Open Command Palette (Ctrl+K or ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Quick Jump</span>
            <kbd className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 shadow-xs font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Guided Tour Trigger */}
          <button
            onClick={onStartTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#635bff] bg-[#f4f3ff] hover:bg-[#ede9fe] border border-[#d9d6fe] transition-colors cursor-pointer shadow-xs shrink-0 min-h-[38px]"
            title="Start interactive demo walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635bff] shrink-0" />
            <span className="hidden lg:inline">Guided Demo</span>
          </button>

          {/* Dry-Run Toggle */}
          <button
            onClick={toggleDryRun}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer shrink-0 min-h-[38px] shadow-xs ${
              config.dryRun
                ? 'bg-[#fffbeb] text-[#92400e] border-[#fde68a] hover:bg-[#fef3c7]'
                : 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0] hover:bg-[#d1fae5]'
            }`}
            title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
          >
            {config.dryRun ? (
              <ToggleRight className="w-4 h-4 text-[#b76e00] shrink-0" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-[#098f74] shrink-0" />
            )}
            <span className="hidden xl:inline">Dry-Run:</span>
            <strong>{config.dryRun ? 'Active' : 'Live'}</strong>
          </button>

          {/* Reload / Run Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#635bff] hover:bg-[#5147e8] disabled:opacity-50 transition-colors shadow-md cursor-pointer shrink-0 min-h-[38px]"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>{isReconciling ? 'Reconciling...' : 'Run Demo (180)'}</span>
          </button>

          {/* Desktop Secondary Action Icons (lg+) */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Configure confidence scoring thresholds and fee tolerances"
              aria-label="Threshold Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenUpload}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Upload custom 3-way statements"
              aria-label="Upload CSVs"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={onExportReports}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Export reconciliation results and audit logs"
              aria-label="Export Reports"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
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
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
              title="More actions and settings"
              aria-label="More actions"
              aria-expanded={isMoreOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-56 surface-modal rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100 border border-slate-200">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                  Workspace Actions
                </div>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#f4f3ff] hover:text-[#635bff] flex items-center gap-2 cursor-pointer text-slate-700 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Command Palette (⌘K)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onStartTour();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#f4f3ff] hover:text-[#635bff] flex items-center gap-2 cursor-pointer text-slate-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#635bff]" />
                  <span>Start Guided Tour</span>
                </button>

                <button
                  onClick={() => {
                    toggleDryRun();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {config.dryRun ? (
                      <ToggleRight className="w-4 h-4 text-[#b76e00]" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#098f74]" />
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
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Threshold Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenUpload();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Statements (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onExportReports();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700 transition-colors"
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
                  className="w-full px-3 py-2 text-left hover:bg-[#fef2f2] text-[#d64550] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#d64550]" />
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

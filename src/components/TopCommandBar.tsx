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
  MoreHorizontal,
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
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const toggleDryRun = () => {
    onUpdateConfig({
      ...config,
      dryRun: !config.dryRun,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
        moreButtonRef.current?.focus();
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
    <header className="glass-command-bar sticky top-0 z-30">
      <div className="px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2 max-w-full">
        {/* Left Side: Mobile Menu Button & Dataset Context */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <button
            onClick={onToggleNavigation}
            className="lg:hidden p-2 rounded-xl text-[#a7afc0] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#111620]/95 text-[#a7afc0] text-xs font-medium border border-white/10 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]" aria-hidden="true"></span>
            <span className="hidden sm:inline text-[#7d879b]">
              Dataset: <strong className="text-[#f7f8fc] font-semibold">Synthetic 3-Way</strong>
            </span>
            <span className="hidden sm:inline text-white/20" aria-hidden="true">|</span>
            <span className="font-mono text-[#f7f8fc] font-bold tabular-nums">{totalRecords}</span>
            <span className="hidden xs:inline">records</span>
          </div>

          {/* AI / Fallback Status Badge (Visible on wide screens without collision) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa] text-xs font-medium border border-[#a78bfa]/30 shrink-0 shadow-xs">
            <Bot className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" aria-hidden="true" />
            <span className="text-[#c4b5fd] font-medium">Gemini Analyst:</span>
            <span className="font-bold text-[11px]">Advisory + Fallback</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls with Uncluttered Priority Hierarchy */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Primary Action 1: Command Palette / Quick Search Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-[#a7afc0] bg-[#111620] border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer min-h-[38px] shadow-xs"
            title="Open Command Palette (Ctrl+K or ⌘K)"
            aria-label="Open Command Palette"
          >
            <Search className="w-3.5 h-3.5 text-[#7d879b]" aria-hidden="true" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-[#0c101a] border border-white/15 rounded px-1.5 py-0.5 text-[#a7afc0] shadow-xs font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Primary Action 2: Guided Demo Tour Trigger */}
          <button
            onClick={onStartTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#7168ff] bg-[#7168ff]/10 hover:bg-[#7168ff]/20 border border-[#7168ff]/30 transition-colors cursor-pointer shadow-xs shrink-0 min-h-[38px]"
            title="Start interactive demo walkthrough"
            aria-label="Start Guided Demo Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7168ff] shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Guided Demo</span>
          </button>

          {/* Primary Action 3: Reload / Run Demo Button (Dominant Action) */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(113,104,255,0.4)] hover:shadow-[0_0_20px_rgba(113,104,255,0.6)] cursor-pointer shrink-0 min-h-[38px]"
            title="Re-run reconciliation on the benchmark dataset"
            aria-label="Run reconciliation demo"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
            <span>{isReconciling ? 'Reconciling...' : 'Run Demo (180)'}</span>
          </button>

          {/* Desktop Direct Action Icons (Only on 2XL+ to avoid crowding at 1280-1440px) */}
          <div className="hidden 2xl:flex items-center gap-1.5">
            {/* Dry-Run Toggle on 2XL */}
            <button
              onClick={toggleDryRun}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer shrink-0 min-h-[38px] shadow-xs ${
                config.dryRun
                  ? 'bg-[#f5b942]/10 text-[#f5b942] border-[#f5b942]/35 hover:bg-[#f5b942]/20'
                  : 'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/35 hover:bg-[#2dd4bf]/20'
              }`}
              title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
              aria-label="Toggle dry-run simulation mode"
            >
              {config.dryRun ? (
                <ToggleRight className="w-4 h-4 text-[#f5b942] shrink-0" aria-hidden="true" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-[#2dd4bf] shrink-0" aria-hidden="true" />
              )}
              <span className="text-[#a7afc0]">Dry-Run:</span>
              <strong className="font-mono uppercase">{config.dryRun ? 'Active' : 'Live'}</strong>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Configure confidence scoring thresholds and fee tolerances"
              aria-label="Threshold Settings"
            >
              <Sliders className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onOpenUpload}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Upload custom 3-way statements"
              aria-label="Upload CSVs"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onExportReports}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Export reconciliation results and audit logs"
              aria-label="Export Reports"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onReset}
              className="p-2 rounded-xl text-[#7d879b] hover:text-[#ff6577] hover:bg-[#ff6577]/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Clear all records and reset workspace"
              aria-label="Reset Workspace"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Responsive Overflow Dropdown Menu (< 2XL) */}
          <div className="relative 2xl:hidden">
            <button
              ref={moreButtonRef}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="More workspace tools and configuration"
              aria-label="More workspace options"
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            </button>

            {isMoreOpen && (
              <div
                ref={moreMenuRef}
                role="menu"
                aria-label="Workspace Actions Menu"
                className="absolute right-0 mt-2 w-60 modal-surface rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-[#f7f8fc] animate-in fade-in zoom-in-95 duration-100 border border-white/15"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#7d879b] uppercase tracking-wider border-b border-white/10 font-mono">
                  Workspace Controls
                </div>

                {/* Dry-Run Toggle in Menu */}
                <button
                  role="menuitem"
                  onClick={() => {
                    toggleDryRun();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between cursor-pointer text-[#a7afc0] hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {config.dryRun ? (
                      <ToggleRight className="w-4 h-4 text-[#f5b942]" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#2dd4bf]" aria-hidden="true" />
                    )}
                    <span>Dry-Run Simulation</span>
                  </span>
                  <span className="font-semibold text-[10px] font-mono uppercase text-[#7d879b]">
                    {config.dryRun ? 'Active' : 'Live'}
                  </span>
                </button>

                <div className="my-1 border-t border-white/10" role="separator" />

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] hover:text-white transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#7d879b]" aria-hidden="true" />
                  <span>Threshold Settings</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenUpload();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] hover:text-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7d879b]" aria-hidden="true" />
                  <span>Upload Statements (CSV)</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onExportReports();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#7d879b]" aria-hidden="true" />
                  <span>Export Reports (CSV/JSON)</span>
                </button>

                <div className="my-1 border-t border-white/10" role="separator" />

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onReset();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#ff6577]/15 text-[#ff6577] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ff6577]" aria-hidden="true" />
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

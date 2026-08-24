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
    <header className="glass-command-bar sticky top-0 z-30">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 max-w-full">
        {/* Left Side: Mobile Menu Button & Dataset Context */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleNavigation}
            className="lg:hidden p-2 rounded-xl text-[#a7afc0] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111620]/90 text-[#a7afc0] text-xs font-medium border border-white/10 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
            <span className="hidden md:inline text-[#7d879b]">Dataset: <strong className="text-[#f7f8fc] font-semibold">Synthetic 3-Way</strong></span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="font-mono text-[#f7f8fc] font-bold tabular-nums">{totalRecords}</span> records
          </div>

          {/* AI / Fallback Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa] text-xs font-medium border border-[#a78bfa]/30 shrink-0 shadow-xs">
            <Bot className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
            <span className="hidden xl:inline text-[#c4b5fd] font-medium">Gemini Analyst:</span>
            <span className="font-bold text-[11px] sm:text-xs">Advisory + Fallback</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#a7afc0] bg-[#111620] border border-white/10 hover:bg-white/5 hover:text-white transition-colors cursor-pointer min-h-[38px] shadow-xs"
            title="Open Command Palette (Ctrl+K or ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#7d879b]" />
            <span className="hidden xl:inline">Quick Jump</span>
            <kbd className="text-[10px] font-mono bg-[#0c101a] border border-white/15 rounded px-1.5 py-0.5 text-[#a7afc0] shadow-xs font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Guided Tour Trigger */}
          <button
            onClick={onStartTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7168ff] bg-[#7168ff]/10 hover:bg-[#7168ff]/20 border border-[#7168ff]/30 transition-colors cursor-pointer shadow-xs shrink-0 min-h-[38px]"
            title="Start interactive demo walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7168ff] shrink-0" />
            <span className="hidden lg:inline">Guided Demo</span>
          </button>

          {/* Dry-Run Toggle */}
          <button
            onClick={toggleDryRun}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer shrink-0 min-h-[38px] shadow-xs ${
              config.dryRun
                ? 'bg-[#f5b942]/10 text-[#f5b942] border-[#f5b942]/35 hover:bg-[#f5b942]/20'
                : 'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/35 hover:bg-[#2dd4bf]/20'
            }`}
            title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
          >
            {config.dryRun ? (
              <ToggleRight className="w-4 h-4 text-[#f5b942] shrink-0" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-[#2dd4bf] shrink-0" />
            )}
            <span className="hidden xl:inline text-[#a7afc0]">Dry-Run:</span>
            <strong className="font-mono uppercase">{config.dryRun ? 'Active' : 'Live'}</strong>
          </button>

          {/* Reload / Run Demo Button (Dominant Action) */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(113,104,255,0.4)] hover:shadow-[0_0_20px_rgba(113,104,255,0.6)] cursor-pointer shrink-0 min-h-[38px]"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>{isReconciling ? 'Reconciling...' : 'Run Demo (180)'}</span>
          </button>

          {/* Desktop Secondary Action Icons (lg+) */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Configure confidence scoring thresholds and fee tolerances"
              aria-label="Threshold Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenUpload}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Upload custom 3-way statements"
              aria-label="Upload CSVs"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={onExportReports}
              className="p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Export reconciliation results and audit logs"
              aria-label="Export Reports"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              className="p-2 rounded-xl text-[#7d879b] hover:text-[#ff6577] hover:bg-[#ff6577]/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
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
              className="p-2 rounded-xl text-[#a7afc0] hover:bg-white/10 transition-colors border border-white/10 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
              title="More actions and settings"
              aria-label="More actions"
              aria-expanded={isMoreOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-56 modal-surface rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-[#f7f8fc] animate-in fade-in zoom-in-95 duration-100 border border-white/15">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#7d879b] uppercase tracking-wider border-b border-white/10 font-mono">
                  Workspace Actions
                </div>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#7168ff]/15 hover:text-[#7168ff] flex items-center gap-2 cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#7d879b]" />
                  <span>Command Palette (⌘K)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onStartTour();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#7168ff]/15 hover:text-[#7168ff] flex items-center gap-2 cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7168ff]" />
                  <span>Start Guided Tour</span>
                </button>

                <button
                  onClick={() => {
                    toggleDryRun();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {config.dryRun ? (
                      <ToggleRight className="w-4 h-4 text-[#f5b942]" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#2dd4bf]" />
                    )}
                    <span>Dry-Run Mode</span>
                  </span>
                  <span className="font-semibold text-[10px] font-mono uppercase text-[#7d879b]">
                    {config.dryRun ? 'Active' : 'Live'}
                  </span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#7d879b]" />
                  <span>Threshold Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenUpload();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7d879b]" />
                  <span>Upload Statements (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onExportReports();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 cursor-pointer text-[#a7afc0] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#7d879b]" />
                  <span>Export Reports</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onReset();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#ff6577]/15 text-[#ff6577] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ff6577]" />
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

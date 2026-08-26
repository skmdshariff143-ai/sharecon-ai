'use client';

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
            className="lg:hidden p-2 rounded-xl text-[#94a3b8] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dataset Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0e131f] text-[#94a3b8] text-xs font-medium border border-white/8 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.7)]" aria-hidden="true"></span>
            <span className="hidden sm:inline text-[#64748b]">
              Dataset: <strong className="text-[#f8fafc] font-semibold">Synthetic 3-Way</strong>
            </span>
            <span className="hidden sm:inline text-white/20" aria-hidden="true">|</span>
            <span className="font-mono text-[#f8fafc] font-bold tabular-nums">{totalRecords}</span>
            <span className="hidden xs:inline">records</span>
          </div>

          {/* AI / Fallback Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#c084fc]/10 text-[#c084fc] text-xs font-medium border border-[#c084fc]/25 shrink-0 shadow-xs">
            <Bot className="w-3.5 h-3.5 text-[#c084fc] shrink-0" aria-hidden="true" />
            <span className="text-[#e9d5ff] font-medium">Gemini Analyst:</span>
            <span className="font-bold text-[11px]">Advisory + Fallback</span>
          </div>
        </div>

        {/* Right Side: Command Bar Controls with Uncluttered Priority Hierarchy */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Primary Action 1: Command Palette / Quick Search Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-[#94a3b8] bg-[#0e131f] border border-white/8 hover:bg-[#141b2b] hover:text-white transition-colors cursor-pointer min-h-[38px] shadow-xs"
            title="Open Command Palette (Ctrl+K or ⌘K)"
            aria-label="Open Command Palette"
          >
            <Search className="w-3.5 h-3.5 text-[#64748b]" aria-hidden="true" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-[#080c14] border border-white/12 rounded px-1.5 py-0.5 text-[#94a3b8] shadow-xs font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Primary Action 2: Guided Demo Tour Trigger */}
          <button
            onClick={onStartTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#818cf8] bg-[#6366f1]/10 hover:bg-[#6366f1]/20 border border-[#6366f1]/25 transition-colors cursor-pointer shadow-xs shrink-0 min-h-[38px]"
            title="Start interactive demo walkthrough"
            aria-label="Start Guided Demo Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#818cf8] shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Guided Demo</span>
          </button>

          {/* Primary Action 3: Reload / Run Demo Button (Dominant Action) */}
          <button
            onClick={onLoadDemo}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:shadow-[0_0_20px_rgba(99,102,241,0.55)] cursor-pointer shrink-0 min-h-[38px]"
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
                  ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30 hover:bg-[#fbbf24]/20'
                  : 'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/30 hover:bg-[#2dd4bf]/20'
              }`}
              title="When Dry-Run is enabled, match outcomes are simulated without live ledger commitments."
              aria-label="Toggle dry-run simulation mode"
            >
              {config.dryRun ? (
                <ToggleRight className="w-4 h-4 text-[#fbbf24] shrink-0" aria-hidden="true" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-[#2dd4bf] shrink-0" aria-hidden="true" />
              )}
              <span className="text-[#94a3b8]">Dry-Run:</span>
              <strong className="font-mono uppercase">{config.dryRun ? 'Active' : 'Live'}</strong>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors border border-white/8 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs bg-[#0e131f]"
              title="Configure confidence scoring thresholds and fee tolerances"
              aria-label="Threshold Settings"
            >
              <Sliders className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onOpenUpload}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors border border-white/8 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs bg-[#0e131f]"
              title="Upload custom 3-way statements"
              aria-label="Upload CSVs"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onExportReports}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors border border-white/8 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs bg-[#0e131f]"
              title="Export reconciliation results and audit logs"
              aria-label="Export Reports"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onReset}
              className="p-2 rounded-xl text-[#64748b] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
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
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors border border-white/8 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs bg-[#0e131f]"
              title="More workspace actions"
              aria-label="More actions menu"
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            </button>

            {isMoreOpen && (
              <div
                ref={moreMenuRef}
                className="absolute right-0 top-full mt-2 w-56 bg-[#141b2b] border border-white/12 rounded-xl shadow-2xl z-50 py-1.5 animate-scale-up"
                role="menu"
                aria-label="Additional workspace tools"
              >
                {/* Mobile/Tablet Dry Run Toggle */}
                <button
                  onClick={() => {
                    toggleDryRun();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    {config.dryRun ? (
                      <ToggleRight className="w-4 h-4 text-[#fbbf24]" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#2dd4bf]" aria-hidden="true" />
                    )}
                    <span>Simulation Mode</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${config.dryRun ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : 'bg-[#2dd4bf]/20 text-[#2dd4bf]'}`}>
                    {config.dryRun ? 'DRY-RUN' : 'LIVE'}
                  </span>
                </button>

                <div className="my-1 border-t border-white/8" />

                {/* Settings */}
                <button
                  onClick={() => {
                    onOpenSettings();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <Sliders className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
                  <span>Threshold Settings</span>
                </button>

                {/* Upload Custom CSV */}
                <button
                  onClick={() => {
                    onOpenUpload();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <Upload className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
                  <span>Upload CSV Statements</span>
                </button>

                {/* Export Reports */}
                <button
                  onClick={() => {
                    onExportReports();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <Download className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
                  <span>Export Reports & Logs</span>
                </button>

                <div className="my-1 border-t border-white/8" />

                {/* Reset Workspace */}
                <button
                  onClick={() => {
                    onReset();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-[#f87171] hover:bg-[#f87171]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <RotateCcw className="w-4 h-4 text-[#f87171]" aria-hidden="true" />
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

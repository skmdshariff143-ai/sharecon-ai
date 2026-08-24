import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  Layers,
  AlertTriangle,
  History,
  Scale,
  BookOpen,
  Play,
  Upload,
  Download,
  ToggleRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

export type WorkspaceTab =
  | 'control_center'
  | 'reconciliation'
  | 'exceptions'
  | 'audit'
  | 'evaluation'
  | 'methodology'
  | 'help';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onLoadDemo: () => void;
  onOpenUpload: () => void;
  onToggleDryRun: () => void;
  onExportReports: () => void;
  onStartTour: () => void;
  records: ReconciliationRecord[];
  onSelectRecord: (record: ReconciliationRecord) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onLoadDemo,
  onOpenUpload,
  onToggleDryRun,
  onExportReports,
  onStartTour,
  records,
  onSelectRecord,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = React.useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) handleClose();
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const filteredRecords = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return records
      .filter(
        (r) =>
          r.payment.paymentId.toLowerCase().includes(q) ||
          r.payment.orderId.toLowerCase().includes(q) ||
          (r.matchedSettlement?.utr && r.matchedSettlement.utr.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [records, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-[#070a10]/80 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div
        className="modal-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] bg-[#111620] border border-white/15 animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#090d16]/80">
          <Search className="w-5 h-5 text-[#7168ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search payment ID, order ref, UTR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent text-[#f7f8fc] placeholder:text-[#7d879b] focus:outline-hidden"
            aria-label="Command search"
          />
          <kbd className="text-[10px] font-mono bg-[#0c101a] border border-white/10 rounded px-1.5 py-0.5 text-[#7d879b] shrink-0 font-semibold">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
          {/* Direct Record Matches (if query active) */}
          {filteredRecords.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#7d879b] uppercase tracking-wider px-2 py-1 font-mono">
                Matching Transaction Records
              </div>
              <div className="space-y-1">
                {filteredRecords.map((r) => (
                  <button
                    key={r.recordId}
                    onClick={() => {
                      onSelectRecord(r);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#f7f8fc] flex items-center justify-between transition-colors cursor-pointer group border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#7168ff] group-hover:text-[#5687ff]">
                        {r.payment.paymentId}
                      </span>
                      <span className="text-[#a7afc0]">({r.payment.orderId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#a7afc0]">{formatINR(r.payment.grossAmount)}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#a7afc0] font-mono">
                        {r.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[10px] font-bold text-[#7d879b] uppercase tracking-wider px-2 py-1 font-mono">
              Quick Operations
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onLoadDemo();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#7168ff]/15 text-[#f7f8fc] flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Play className="w-3.5 h-3.5 text-[#7168ff] shrink-0" />
                <span>Run Demo Batch (180 Synthetic Records)</span>
              </button>

              <button
                onClick={() => {
                  onStartTour();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#7168ff]/15 text-[#f7f8fc] flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7168ff] shrink-0" />
                <span>Start 5-Minute Guided Evaluation Tour</span>
              </button>

              <button
                onClick={() => {
                  onOpenUpload();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-[#7d879b] shrink-0" />
                <span>Upload Custom 3-Way CSV Statements</span>
              </button>

              <button
                onClick={() => {
                  onExportReports();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[#7d879b] shrink-0" />
                <span>Export Audit &amp; Reconciliation Reports</span>
              </button>

              <button
                onClick={() => {
                  onToggleDryRun();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f5b942]/15 text-[#a7afc0] hover:text-[#f5b942] flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <ToggleRight className="w-3.5 h-3.5 text-[#f5b942] shrink-0" />
                <span>Toggle Dry-Run Mode</span>
              </button>
            </div>
          </div>

          {/* Navigation Workspaces */}
          <div>
            <div className="text-[10px] font-bold text-[#7d879b] uppercase tracking-wider px-2 py-1 font-mono">
              Workspaces
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('control_center');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#7168ff]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#7168ff]">Control Center</span>
                  <span className="text-[#7d879b] text-[11px]">Executive overview &amp; funnel</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#7168ff]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('reconciliation');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-3.5 h-3.5 text-[#7d879b] group-hover:text-[#7168ff]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#7168ff]">Reconciliation Workspace</span>
                  <span className="text-[#7d879b] text-[11px]">3-way data grid &amp; filters</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#7168ff]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('exceptions');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#ff6577]/15 text-[#a7afc0] hover:text-[#ff6577] flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff6577]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#ff6577]">Exception Command Center</span>
                  <span className="text-[#7d879b] text-[11px]">Triage &amp; Gemini advisory</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#ff6577]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('audit');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-3.5 h-3.5 text-[#7d879b] group-hover:text-[#7168ff]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#7168ff]">Audit Trail</span>
                  <span className="text-[#7d879b] text-[11px]">Append-only timeline</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#7168ff]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('evaluation');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-3.5 h-3.5 text-[#7168ff]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#7168ff]">Evaluation Lab</span>
                  <span className="text-[#7d879b] text-[11px]">Honest benchmark &amp; simulator</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#7168ff]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('methodology');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#7d879b] group-hover:text-[#7168ff]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#7168ff]">Methodology &amp; Safety</span>
                  <span className="text-[#7d879b] text-[11px]">Architecture &amp; math rules</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#7168ff]" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('help');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#a7afc0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span className="font-semibold text-[#f7f8fc] group-hover:text-[#2dd4bf]">Help &amp; Guide (Judge Onboarding)</span>
                  <span className="text-[#7d879b] text-[11px]">FAQs &amp; glossary</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#7d879b] group-hover:text-[#2dd4bf]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

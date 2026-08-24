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

  const matchedRecords = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return records
      .filter(
        (r) =>
          r.recordId.toLowerCase().includes(q) ||
          r.payment.orderId.toLowerCase().includes(q) ||
          (r.matchedSettlement?.utr && r.matchedSettlement.utr.toLowerCase().includes(q)) ||
          r.exceptionType.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, records]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={handleClose}
    >
      <div
        className="surface-modal max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search records, switch workspaces, or run actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded ml-2 font-semibold">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="p-2.5 overflow-y-auto space-y-3 text-xs custom-scrollbar">
          {/* Matched Records if query present */}
          {matchedRecords.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
                Matching Records
              </div>
              <div className="space-y-1">
                {matchedRecords.map((rec) => (
                  <button
                    key={rec.recordId}
                    onClick={() => {
                      onSelectRecord(rec);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">
                        {rec.payment.paymentId}
                      </span>
                      <span className="text-slate-400 ml-2 font-mono">({rec.payment.orderId})</span>
                      <span className="ml-2 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {rec.exceptionType}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(rec.payment.grossAmount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
              Quick Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onStartTour();
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Start Guided Demo Tour</span>
              </button>

              <button
                onClick={() => {
                  onLoadDemo();
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Reload Demo (180 Records)</span>
              </button>

              <button
                onClick={() => {
                  onOpenUpload();
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Upload Custom CSVs</span>
              </button>

              <button
                onClick={() => {
                  onExportReports();
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Export Audit &amp; Reconciliation Reports</span>
              </button>

              <button
                onClick={() => {
                  onToggleDryRun();
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center gap-2 transition-colors cursor-pointer font-medium"
              >
                <ToggleRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Toggle Dry-Run Mode</span>
              </button>
            </div>
          </div>

          {/* Navigation Workspaces */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
              Workspaces
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('control_center');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Control Center</span>
                  <span className="text-slate-400 text-[11px]">Executive overview &amp; funnel</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('reconciliation');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Reconciliation Workspace</span>
                  <span className="text-slate-400 text-[11px]">3-way data grid &amp; filters</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('exceptions');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-rose-700">Exception Command Center</span>
                  <span className="text-slate-400 text-[11px]">Triage &amp; Gemini advisory</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('audit');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Audit Trail</span>
                  <span className="text-slate-400 text-[11px]">Append-only timeline</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('evaluation');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Evaluation Lab</span>
                  <span className="text-slate-400 text-[11px]">Honest benchmark &amp; simulator</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('methodology');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Methodology &amp; Safety</span>
                  <span className="text-slate-400 text-[11px]">Architecture &amp; math rules</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('help');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Help &amp; Guide (Judge Onboarding)</span>
                  <span className="text-slate-400 text-[11px]">FAQs &amp; glossary</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

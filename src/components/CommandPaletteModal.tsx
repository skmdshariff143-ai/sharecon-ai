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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Actions & Navigations
  const staticCommands = useMemo(
    () => [
      {
        id: 'nav-control-center',
        title: 'Go to Control Center',
        category: 'Navigation',
        icon: LayoutDashboard,
        action: () => onSelectTab('control_center'),
      },
      {
        id: 'nav-reconciliation',
        title: 'Go to Reconciliation Ledger',
        category: 'Navigation',
        icon: Layers,
        action: () => onSelectTab('reconciliation'),
      },
      {
        id: 'nav-exceptions',
        title: 'Go to Exception Command Center',
        category: 'Navigation',
        icon: AlertTriangle,
        action: () => onSelectTab('exceptions'),
      },
      {
        id: 'nav-audit',
        title: 'Go to Audit Trail',
        category: 'Navigation',
        icon: History,
        action: () => onSelectTab('audit'),
      },
      {
        id: 'nav-evaluation',
        title: 'Go to Evaluation Lab',
        category: 'Navigation',
        icon: Scale,
        action: () => onSelectTab('evaluation'),
      },
      {
        id: 'nav-methodology',
        title: 'Go to Methodology & Safety',
        category: 'Navigation',
        icon: BookOpen,
        action: () => onSelectTab('methodology'),
      },
      {
        id: 'cmd-run-demo',
        title: 'Run Reconciliation Demo (180 records)',
        category: 'Actions',
        icon: Play,
        action: onLoadDemo,
      },
      {
        id: 'cmd-guided-tour',
        title: 'Start Interactive Guided Demo Tour',
        category: 'Actions',
        icon: Sparkles,
        action: onStartTour,
      },
      {
        id: 'cmd-upload-csv',
        title: 'Upload Custom 3-Way CSV Statements',
        category: 'Actions',
        icon: Upload,
        action: onOpenUpload,
      },
      {
        id: 'cmd-toggle-dryrun',
        title: 'Toggle Dry-Run Simulation Mode',
        category: 'Actions',
        icon: ToggleRight,
        action: onToggleDryRun,
      },
      {
        id: 'cmd-export-reports',
        title: 'Export Reconciliation Reports & Audit Logs',
        category: 'Actions',
        icon: Download,
        action: onExportReports,
      },
    ],
    [
      onSelectTab,
      onLoadDemo,
      onStartTour,
      onOpenUpload,
      onToggleDryRun,
      onExportReports,
    ]
  );

  // Matching records
  const matchingRecords = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return records
      .filter(
        (r) =>
          r.payment.paymentId.toLowerCase().includes(q) ||
          r.payment.orderId.toLowerCase().includes(q) ||
          (r.matchedSettlement?.utr && r.matchedSettlement.utr.toLowerCase().includes(q)) ||
          r.exceptionType.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, records]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return staticCommands;
    const q = query.toLowerCase().trim();
    const stem = q.endsWith('s') ? q.slice(0, -1) : q;
    return staticCommands.filter((c) => {
      const title = c.title.toLowerCase();
      const cat = c.category.toLowerCase();
      return (
        title.includes(q) ||
        title.includes(stem) ||
        cat.includes(q) ||
        cat.includes(stem) ||
        c.id.includes(stem)
      );
    });
  }, [query, staticCommands]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#070a10]/85 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="modal-surface max-w-xl w-full shadow-2xl bg-[#141b2b] border border-white/12 rounded-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 bg-[#080c14]">
          <Search className="w-5 h-5 text-[#818cf8]" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Type a command, navigation shortcut, or search Payment ID/UTR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-hidden"
          />
          <kbd className="text-[10px] font-mono bg-[#141b2b] border border-white/10 rounded px-1.5 py-0.5 text-[#94a3b8]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Matching Transactions */}
          {matchingRecords.length > 0 && (
            <div className="pb-2 mb-2 border-b border-white/8">
              <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#64748b] uppercase tracking-wider">
                Matching Transactions
              </div>
              {matchingRecords.map((r) => (
                <button
                  key={r.recordId}
                  onClick={() => {
                    onSelectRecord(r);
                    handleClose();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer group text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#f8fafc] font-mono group-hover:text-[#818cf8]">
                      {r.payment.paymentId}
                    </span>
                    <span className="text-[11px] text-[#64748b] font-mono">({r.payment.orderId})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#94a3b8]">{formatINR(r.payment.grossAmount)}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        r.status === 'AUTO_RECONCILED'
                          ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]'
                          : r.status === 'PENDING_REVIEW'
                          ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                          : 'bg-[#f87171]/20 text-[#f87171]'
                      }`}
                    >
                      {r.confidence}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Commands & Actions */}
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    handleClose();
                  }}
                  className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer group text-xs text-[#94a3b8] hover:text-[#f8fafc]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#64748b] group-hover:text-[#818cf8] transition-colors" />
                    <span>{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b] bg-[#080c14] px-2 py-0.5 rounded border border-white/6">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[#64748b] font-sans">
              No matching commands or transactions found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/8 bg-[#080c14] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
          <span>Navigate with ⌘K / Ctrl+K</span>
          <span>Deterministic Three-Way Search</span>
        </div>
      </div>
    </div>
  );
};

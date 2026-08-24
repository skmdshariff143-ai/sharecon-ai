'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  History,
  Scale,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react';

export type WorkspaceTab =
  | 'control_center'
  | 'reconciliation'
  | 'exceptions'
  | 'audit'
  | 'evaluation'
  | 'methodology'
  | 'help';

interface NavigationRailProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingReviewCount: number;
  exceptionCount: number;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  onToggleCollapse,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  pendingReviewCount,
  exceptionCount,
}) => {
  const navItems = [
    {
      id: 'control_center' as WorkspaceTab,
      label: 'Control Center',
      icon: LayoutDashboard,
      badge: null,
      description: 'Executive overview & funnel',
    },
    {
      id: 'reconciliation' as WorkspaceTab,
      label: 'Reconciliation',
      icon: Layers,
      badge:
        pendingReviewCount > 0 ? (
          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
            {pendingReviewCount}
          </span>
        ) : null,
      description: '3-way ledger matching grid',
    },
    {
      id: 'exceptions' as WorkspaceTab,
      label: 'Exceptions',
      icon: AlertTriangle,
      badge:
        exceptionCount > 0 ? (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
            {exceptionCount}
          </span>
        ) : null,
      description: 'Discrepancy triage & AI copilot',
    },
    {
      id: 'audit' as WorkspaceTab,
      label: 'Audit Trail',
      icon: History,
      badge: null,
      description: 'Append-only event log',
    },
    {
      id: 'evaluation' as WorkspaceTab,
      label: 'Evaluation Lab',
      icon: Scale,
      badge: (
        <span className="bg-indigo-500/25 text-indigo-300 border border-indigo-400/40 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
          Honest
        </span>
      ),
      description: 'Benchmark & threshold simulator',
    },
    {
      id: 'methodology' as WorkspaceTab,
      label: 'Methodology & Safety',
      icon: BookOpen,
      badge: null,
      description: 'System architecture & math rules',
    },
    {
      id: 'help' as WorkspaceTab,
      label: 'Help & Guide',
      icon: ShieldCheck,
      badge: null,
      description: 'Judge guide, FAQs & glossary',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Rail Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0c1220] text-slate-300 flex flex-col transition-all duration-200 ease-in-out border-r border-slate-800/80 shadow-2xl ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(79,70,229,0.35)] border border-indigo-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-white tracking-tight flex items-center gap-1.5 text-sm">
                  <span>ShaRecon</span>
                  <span className="text-indigo-400 font-extrabold">AI</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  AI Finance Controller
                </div>
              </div>
            )}
          </div>

          {/* Close on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
              Workspaces
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-[0_2px_8px_rgba(79,70,229,0.3)] border border-indigo-400/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                title={item.label}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <div className="truncate">{item.label}</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && item.badge}
              </button>
            );
          })}
        </nav>

        {/* Footer / Track Info & Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-slate-950/30">
          {!isCollapsed && (
            <div className="bg-slate-800/60 rounded-xl p-2.5 mb-2 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Razorpay Buildathon</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                AI Finance Controller Track Prototype
              </p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse navigation</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

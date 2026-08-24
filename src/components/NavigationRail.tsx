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
          <span className="bg-[#f5b942]/20 text-[#f5b942] border border-[#f5b942]/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
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
          <span className="bg-[#ff6577]/20 text-[#ff6577] border border-[#ff6577]/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
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
        <span className="bg-[#7168ff]/20 text-[#c4b5fd] border border-[#7168ff]/40 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
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
          className="fixed inset-0 z-40 bg-[#070a10]/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Rail Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#090d16] text-[#a7afc0] flex flex-col transition-all duration-200 ease-in-out border-r border-white/10 shadow-2xl ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#070a10]/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7168ff] to-[#5687ff] flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(113,104,255,0.5)] border border-white/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-[#f7f8fc] tracking-tight flex items-center gap-1.5 text-sm font-mono">
                  <span>ShaRecon</span>
                  <span className="text-[#7168ff] font-extrabold">AI</span>
                </div>
                <div className="text-[10px] text-[#7d879b] font-medium">
                  AI Finance Controller
                </div>
              </div>
            )}
          </div>

          {/* Close on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#7d879b] uppercase tracking-wider px-3 mb-2 font-mono">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group relative min-h-[42px] ${
                  isActive
                    ? 'bg-[#7168ff]/18 text-[#f7f8fc] font-bold shadow-[0_0_12px_rgba(113,104,255,0.3)] border border-[#7168ff]/40'
                    : 'text-[#a7afc0] hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                title={item.label}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'text-[#7168ff]'
                        : 'text-[#7d879b] group-hover:text-[#a7afc0]'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <div className="truncate font-sans">{item.label}</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && item.badge}
              </button>
            );
          })}
        </nav>

        {/* Footer / Track Info & Collapse Toggle */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#070a10]/60">
          {!isCollapsed && (
            <div className="bg-[#111620]/90 rounded-xl p-2.5 mb-2 border border-white/10 shadow-inner">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f7f8fc] mb-0.5">
                <Zap className="w-3.5 h-3.5 text-[#f5b942]" />
                <span className="font-mono">Razorpay Buildathon</span>
              </div>
              <p className="text-[10px] text-[#7d879b] leading-tight">
                AI Finance Controller Track Prototype
              </p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-[#7d879b] hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-h-[38px]"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#a7afc0]">
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

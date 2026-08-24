'use client';

import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  UserCheck,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { AuditEvent } from '@/types/reconciliation';

interface AuditTabProps {
  auditEvents: AuditEvent[];
  onDownloadAuditJson: () => void;
  onDownloadAuditCsv: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  auditEvents,
  onDownloadAuditJson,
  onDownloadAuditCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (actorFilter !== 'ALL' && ev.actor !== actorFilter) return false;
      if (actionFilter !== 'ALL' && ev.action !== actionFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        ev.eventId.toLowerCase().includes(q) ||
        (ev.entityIds.paymentId && ev.entityIds.paymentId.toLowerCase().includes(q)) ||
        (ev.entityIds.settlementId && ev.entityIds.settlementId.toLowerCase().includes(q)) ||
        (ev.entityIds.bankTransactionId && ev.entityIds.bankTransactionId.toLowerCase().includes(q)) ||
        ev.reason.toLowerCase().includes(q)
      );
    });
  }, [auditEvents, actorFilter, actionFilter, searchQuery]);

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'SYSTEM_ENGINE':
        return (
          <span className="status-badge bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cpu className="w-3 h-3 text-indigo-600" /> System Engine
          </span>
        );
      case 'FINANCE_REVIEWER':
        return (
          <span className="status-badge bg-emerald-50 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-600" /> Finance Reviewer
          </span>
        );
      case 'ADMIN':
        return (
          <span className="status-badge bg-slate-100 text-slate-700 border border-slate-200">
            <Sliders className="w-3 h-3 text-slate-500" /> Admin Policy
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'AUTO_RECONCILE':
      case 'MANUAL_APPROVE':
        return (
          <span className="status-badge bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {action}
          </span>
        );
      case 'MANUAL_REJECT':
      case 'INVESTIGATION_FLAG':
        return (
          <span className="status-badge bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> {action}
          </span>
        );
      default:
        return (
          <span className="status-badge bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="surface-card overflow-hidden flex flex-col">
      {/* Header & Export Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Immutable Audit Trail ({auditEvents.length} Events Logged)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only chronological decision record of all automated and reviewer transactions.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Event Search */}
          <input
            type="text"
            placeholder="Search Event ID, Payment, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48 transition-colors"
          />

          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Actors</option>
            <option value="SYSTEM_ENGINE">System Engine</option>
            <option value="FINANCE_REVIEWER">Finance Reviewer</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="AUTO_RECONCILE">AUTO_RECONCILE</option>
            <option value="MANUAL_APPROVE">MANUAL_APPROVE</option>
            <option value="MANUAL_REJECT">MANUAL_REJECT</option>
            <option value="BATCH_RUN">BATCH_RUN</option>
          </select>

          {/* Download JSON / CSV */}
          <button
            onClick={onDownloadAuditJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            title="Download immutable audit trail as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onDownloadAuditCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            title="Download audit events as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Event Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 z-10 font-mono">
            <tr className="text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Actor</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">Entity Reference</th>
              <th className="py-2.5 px-4">State Transition</th>
              <th className="py-2.5 px-4">Evidence Reason / Note</th>
              <th className="py-2.5 px-4 text-center">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredEvents.map((ev) => (
              <tr key={ev.eventId} className="hover:bg-slate-50 transition-colors">
                {/* Timestamp */}
                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                  {ev.timestamp.replace('T', ' ').slice(0, 19)}
                </td>

                {/* Actor */}
                <td className="py-2.5 px-4">{getActorBadge(ev.actor)}</td>

                {/* Action */}
                <td className="py-2.5 px-4">{getActionBadge(ev.action)}</td>

                {/* Entity Reference */}
                <td className="py-2.5 px-4 font-mono text-[11px]">
                  <div className="text-slate-900 font-semibold">{ev.entityIds.paymentId || '—'}</div>
                  {ev.entityIds.settlementId && (
                    <div className="text-indigo-600 text-[10px]">{ev.entityIds.settlementId}</div>
                  )}
                </td>

                {/* State Transition */}
                <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]">
                  <span className="text-slate-400">{ev.previousState}</span>
                  <span className="text-slate-400 mx-1.5">➔</span>
                  <strong className="text-slate-900">{ev.newState}</strong>
                </td>

                {/* Reason */}
                <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate font-sans" title={ev.reason}>
                  {ev.reason}
                </td>

                {/* Score */}
                <td className="py-2.5 px-4 text-center">
                  <span className="font-bold text-slate-800 font-mono tabular-nums">{ev.confidence}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono">
        Showing <strong>{filteredEvents.length}</strong> of <strong>{auditEvents.length}</strong> events logged.
      </div>
    </div>
  );
};

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
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (actorFilter !== 'ALL' && ev.actor !== actorFilter) return false;
      if (actionFilter !== 'ALL' && ev.action !== actionFilter) return false;
      return true;
    });
  }, [auditEvents, actorFilter, actionFilter]);

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'SYSTEM_ENGINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Cpu className="w-3 h-3" /> System Engine
          </span>
        );
      case 'FINANCE_REVIEWER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="w-3 h-3" /> Finance Reviewer
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Sliders className="w-3 h-3" /> Admin Policy
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'AUTO_RECONCILE':
      case 'MANUAL_APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {action}
          </span>
        );
      case 'MANUAL_REJECT':
      case 'INVESTIGATION_FLAG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> {action}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Header & Export Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Immutable Audit Trail ({auditEvents.length} Events Logged)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only chronological decision record of all automated and reviewer transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Actors</option>
            <option value="SYSTEM_ENGINE">System Engine</option>
            <option value="FINANCE_REVIEWER">Finance Reviewer</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
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
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
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
                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
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
                <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={ev.reason}>
                  {ev.reason}
                </td>

                {/* Score */}
                <td className="py-2.5 px-4 text-center">
                  <span className="font-bold text-slate-800">{ev.confidence}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        Showing <strong>{filteredEvents.length}</strong> of <strong>{auditEvents.length}</strong> events logged.
      </div>
    </div>
  );
};

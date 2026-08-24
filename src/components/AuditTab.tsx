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
          <span className="status-badge bg-[#7168ff]/15 text-[#c4b5fd] border border-[#7168ff]/35">
            <Cpu className="w-3 h-3 text-[#7168ff]" /> System Engine
          </span>
        );
      case 'FINANCE_REVIEWER':
        return (
          <span className="status-badge bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35">
            <UserCheck className="w-3 h-3 text-[#2dd4bf]" /> Finance Reviewer
          </span>
        );
      case 'ADMIN':
        return (
          <span className="status-badge bg-white/10 text-[#a7afc0] border border-white/10">
            <Sliders className="w-3 h-3 text-[#7d879b]" /> Admin Policy
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'AUTO_RECONCILE':
      case 'MANUAL_APPROVE':
        return (
          <span className="status-badge bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/35">
            <CheckCircle2 className="w-3 h-3 text-[#2dd4bf]" /> {action}
          </span>
        );
      case 'MANUAL_REJECT':
      case 'INVESTIGATION_FLAG':
        return (
          <span className="status-badge bg-[#ff6577]/15 text-[#ff6577] border border-[#ff6577]/35">
            <AlertCircle className="w-3 h-3 text-[#ff6577]" /> {action}
          </span>
        );
      default:
        return (
          <span className="status-badge bg-white/10 text-[#a7afc0] border border-white/10">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="elevated-card overflow-hidden flex flex-col bg-[#111620] border-white/10">
      {/* Header & Export Controls */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#090d16]/70">
        <div>
          <h3 className="text-sm font-bold text-[#f7f8fc] flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-[#7168ff]" />
            <span>Immutable Audit Trail ({auditEvents.length} Events Logged)</span>
          </h3>
          <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
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
            className="text-xs bg-[#0c101a] border border-white/10 rounded-xl px-3 py-1.5 text-[#f7f8fc] placeholder:text-[#7d879b] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff] w-48 transition-colors"
          />

          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs bg-[#0c101a] border border-white/10 rounded-xl px-3 py-1.5 text-[#a7afc0] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Actors</option>
            <option value="SYSTEM_ENGINE">System Engine</option>
            <option value="FINANCE_REVIEWER">Finance Reviewer</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-[#0c101a] border border-white/10 rounded-xl px-3 py-1.5 text-[#a7afc0] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="AUTO_RECONCILE">AUTO_RECONCILE</option>
            <option value="MANUAL_APPROVE">MANUAL_APPROVE</option>
            <option value="MANUAL_REJECT">MANUAL_REJECT</option>
            <option value="BATCH_RUN">BATCH_RUN</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={onDownloadAuditCsv}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#a7afc0] hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#7d879b]" />
            <span>Export CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={onDownloadAuditJson}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#a7afc0] hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-[#7d879b]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Events Table Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left divide-y divide-white/10">
          <thead className="bg-[#090d16] text-[#7d879b] font-semibold uppercase text-[10px] font-mono">
            <tr>
              <th className="py-2.5 px-3.5">Timestamp (UTC)</th>
              <th className="py-2.5 px-3.5">Event ID</th>
              <th className="py-2.5 px-3.5">Actor</th>
              <th className="py-2.5 px-3.5">Action Executed</th>
              <th className="py-2.5 px-3.5">Entity Trace</th>
              <th className="py-2.5 px-3.5">Decision Rationale &amp; Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#7d879b] font-sans">
                  No audit log events match the active search filter.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr key={ev.eventId} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3.5 text-[#7d879b] whitespace-nowrap">
                    {new Date(ev.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-[#f7f8fc]">{ev.eventId}</td>
                  <td className="py-2.5 px-3.5 font-sans">{getActorBadge(ev.actor)}</td>
                  <td className="py-2.5 px-3.5 font-sans">{getActionBadge(ev.action)}</td>
                  <td className="py-2.5 px-3.5 text-[#a7afc0] max-w-[200px] truncate">
                    {ev.entityIds.paymentId && <div>Pay: {ev.entityIds.paymentId}</div>}
                    {ev.entityIds.settlementId && <div>Set: {ev.entityIds.settlementId}</div>}
                    {ev.entityIds.bankTransactionId && <div>Bank: {ev.entityIds.bankTransactionId}</div>}
                  </td>
                  <td className="py-2.5 px-3.5 text-[#a7afc0] font-sans max-w-md">
                    <p className="line-clamp-2 leading-relaxed">{ev.reason}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

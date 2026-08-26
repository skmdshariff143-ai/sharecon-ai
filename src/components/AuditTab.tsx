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
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  Lock,
} from 'lucide-react';
import { AuditEvent } from '@/types/reconciliation';
import { verifyLedgerIntegrity, LedgerVerificationResult } from '@/lib/dataset/audit_ledger';

interface AuditTabProps {
  auditEvents: AuditEvent[];
  onDownloadAuditJson: () => void;
  onDownloadAuditCsv: () => void;
  onDownloadCompliancePackage?: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  auditEvents,
  onDownloadAuditJson,
  onDownloadAuditCsv,
  onDownloadCompliancePackage,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [verificationResult, setVerificationResult] = useState<LedgerVerificationResult | null>(null);

  const handleVerifyLedger = () => {
    const result = verifyLedgerIntegrity(auditEvents);
    setVerificationResult(result);
  };

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
        ev.reason.toLowerCase().includes(q) ||
        (ev.eventHash && ev.eventHash.toLowerCase().includes(q))
      );
    });
  }, [auditEvents, actorFilter, actionFilter, searchQuery]);

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'SYSTEM_ENGINE':
        return (
          <span className="status-badge bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/30">
            <Cpu className="w-3 h-3 text-[#818cf8]" /> System Engine
          </span>
        );
      case 'FINANCE_REVIEWER':
        return (
          <span className="status-badge bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
            <UserCheck className="w-3 h-3 text-[#2dd4bf]" /> Finance Reviewer
          </span>
        );
      case 'ADMIN':
        return (
          <span className="status-badge bg-white/10 text-[#94a3b8] border border-white/10">
            <Sliders className="w-3 h-3 text-[#64748b]" /> Admin Policy
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'AUTO_RECONCILE':
      case 'MANUAL_APPROVE':
        return (
          <span className="status-badge bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
            <CheckCircle2 className="w-3 h-3 text-[#2dd4bf]" /> {action}
          </span>
        );
      case 'MANUAL_REJECT':
      case 'INVESTIGATION_FLAG':
        return (
          <span className="status-badge bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30">
            <AlertCircle className="w-3 h-3 text-[#f87171]" /> {action}
          </span>
        );
      default:
        return (
          <span className="status-badge bg-white/10 text-[#94a3b8] border border-white/10">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="elevated-card overflow-hidden flex flex-col bg-[#0e131f] border-white/8 shadow-xl">
      {/* Header & Export Controls */}
      <div className="p-4 sm:p-5 border-b border-white/8 flex flex-wrap items-center justify-between gap-3 bg-[#080c14]">
        <div>
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-[#818cf8]" />
            <span>Tamper-Evident Forensic Audit Ledger</span>
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
            Every auto-reconciliation, manual approval, override, and policy mutation bound via SHA-256 hash-chaining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2dd4bf]/15 hover:bg-[#2dd4bf]/25 text-[#2dd4bf] rounded-xl text-xs font-bold border border-[#2dd4bf]/30 transition-all cursor-pointer shadow-xs"
            title="Recompute and verify SHA-256 hash chain across all audit blocks"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>Verify Ledger Integrity</span>
          </button>
          {onDownloadCompliancePackage && (
            <button
              onClick={onDownloadCompliancePackage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] text-white rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Compliance Package (JSON)</span>
            </button>
          )}
          <button
            onClick={onDownloadAuditCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#080c14] hover:bg-[#141b2b] text-[#94a3b8] hover:text-white rounded-xl text-xs font-semibold border border-white/8 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onDownloadAuditJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6366f1]/15 hover:bg-[#6366f1]/25 text-[#a5b4fc] rounded-xl text-xs font-semibold border border-[#6366f1]/30 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-[#818cf8]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Ledger Verification Banner */}
      {verificationResult && (
        <div
          className={`p-3.5 px-4 sm:px-5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-all ${
            verificationResult.isValid
              ? 'bg-[#2dd4bf]/10 border-[#2dd4bf]/25 text-[#2dd4bf]'
              : 'bg-[#f87171]/10 border-[#f87171]/25 text-[#f87171]'
          }`}
        >
          <div className="flex items-center gap-2">
            {verificationResult.isValid ? (
              <ShieldCheck className="w-4 h-4 text-[#2dd4bf] shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#f87171] shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {verificationResult.isValid
                  ? `Cryptographic Ledger Verified: ${verificationResult.verifiedCount} Blocks Intact`
                  : `Integrity Violation Detected at Block #${(verificationResult.brokenAtIndex ?? 0) + 1}`}
              </span>
              <p className="text-[11px] text-[#94a3b8] font-sans mt-0.5">
                {verificationResult.isValid
                  ? 'All sequential block hashes match previous pointers. Zero retroactive tampering or ledger deletion detected.'
                  : verificationResult.reason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#64748b]" />
              <span>Head Hash:</span>
              <strong className="text-[#f8fafc]">{verificationResult.latestBlockHash.slice(0, 12)}...</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3.5 border-b border-white/8 flex flex-wrap items-center justify-between gap-3 bg-[#0e131f]">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search event ID, payment ref, block hash, or rationale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#94a3b8] font-mono focus:outline-hidden"
            aria-label="Filter by Actor"
          >
            <option value="ALL">All Actors</option>
            <option value="SYSTEM_ENGINE">System Engine</option>
            <option value="FINANCE_REVIEWER">Finance Reviewer</option>
            <option value="ADMIN">Admin Policy</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#94a3b8] font-mono focus:outline-hidden"
            aria-label="Filter by Action"
          >
            <option value="ALL">All Actions</option>
            <option value="AUTO_RECONCILE">AUTO_RECONCILE</option>
            <option value="MANUAL_APPROVE">MANUAL_APPROVE</option>
            <option value="MANUAL_REJECT">MANUAL_REJECT</option>
            <option value="INVESTIGATION_FLAG">INVESTIGATION_FLAG</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left divide-y divide-white/8">
          <thead className="bg-[#080c14] text-[#64748b] font-semibold uppercase text-[10px] font-mono">
            <tr>
              <th className="py-2.5 px-3">Block / Hash</th>
              <th className="py-2.5 px-3">Timestamp (UTC)</th>
              <th className="py-2.5 px-3">Event ID</th>
              <th className="py-2.5 px-3">Actor</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Associated Entities</th>
              <th className="py-2.5 px-3">Audit Reason &amp; Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#64748b] font-sans">
                  No audit trail events match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event, idx) => (
                <tr key={event.eventId} className="hover:bg-white/4 transition-colors">
                  <td className="py-2.5 px-3 text-[#94a3b8] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#818cf8] text-[11px]">
                        #{event.sequenceNumber ?? filteredEvents.length - idx}
                      </span>
                      {event.eventHash ? (
                        <span
                          className="bg-[#141b2b] text-[#a5b4fc] border border-white/8 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1 font-mono"
                          title={`Block Hash: ${event.eventHash}\nPrevious Hash: ${event.prevHash ?? 'GENESIS'}`}
                        >
                          <LinkIcon className="w-2.5 h-2.5 text-[#6366f1]" />
                          {event.eventHash.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-[#64748b] text-[10px]">genesis</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[#94a3b8] whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#f8fafc]">
                    {event.eventId.slice(0, 16)}...
                  </td>
                  <td className="py-2.5 px-3 font-sans">{getActorBadge(event.actor)}</td>
                  <td className="py-2.5 px-3 font-sans">{getActionBadge(event.action)}</td>
                  <td className="py-2.5 px-3 text-[#94a3b8] font-sans">
                    {event.entityIds.paymentId && (
                      <span className="block font-mono text-[11px] text-[#f8fafc]">
                        Payment: {event.entityIds.paymentId}
                      </span>
                    )}
                    {event.entityIds.settlementId && (
                      <span className="block font-mono text-[10px] text-[#64748b]">
                        Settlement: {event.entityIds.settlementId}
                      </span>
                    )}
                    {event.entityIds.bankTransactionId && (
                      <span className="block font-mono text-[10px] text-[#64748b]">
                        Bank Tx: {event.entityIds.bankTransactionId}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#94a3b8] max-w-xs truncate font-sans" title={event.reason}>
                    {event.reason}
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

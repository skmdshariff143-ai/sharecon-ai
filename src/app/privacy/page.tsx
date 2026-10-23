import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, EyeOff, Database, Server, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ShaRecon AI',
  description: 'Data collection, processing, retention, and privacy guarantees of ShaRecon AI.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#070a10] text-[#f7f8fc] px-4 py-12 md:py-16 selection:bg-[#7168ff] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#94a3b8] hover:text-white transition-colors bg-[#0e131f] border border-white/10 px-3.5 py-2 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Control Center</span>
        </Link>

        {/* Header */}
        <header className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#818cf8] uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4 text-[#818cf8]" />
            <span>Governance & Data Trust</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Effective Date: October 21, 2026 • Version 1.0 (Buildathon Deployment)
          </p>
        </header>

        {/* Summary Card */}
        <div className="bg-[#0e131f] border border-[#818cf8]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7168ff]/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#818cf8]" />
            <span>Executive Privacy Commitment</span>
          </h2>
          <p className="text-sm text-[#cbd5e1] leading-relaxed mb-4">
            ShaRecon AI is architected with a strict <strong className="text-white">zero-server-persistence invariant</strong>.
            All merchant ledger records, gateway settlement batches, and commercial bank statements uploaded via CSV or ISO 20022 CAMT.053 XML
            are processed exclusively inside volatile browser memory (<code className="text-[#a5b4fc] bg-white/5 px-1 py-0.5 rounded font-mono">React.useState</code>).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-[#141b2b] border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-white">Zero Tracking Cookies</div>
                <div className="text-[#94a3b8]">No analytics tags, no ad pixels, no tracking storage.</div>
              </div>
            </div>
            <div className="bg-[#141b2b] border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
              <Database className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-white">Zero Server Storage</div>
                <div className="text-[#94a3b8]">No database, no user accounts, no persisted ledger records.</div>
              </div>
            </div>
            <div className="bg-[#141b2b] border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-white">Instant Session Erasure</div>
                <div className="text-[#94a3b8]">Refreshing or closing the browser tab permanently purges all data.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <section className="space-y-6 text-sm text-[#cbd5e1] leading-relaxed">
          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>1. Data Collection & Processing Scope</span>
            </h3>
            <p>
              When using ShaRecon AI, you may provide financial ledger statements containing:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94a3b8]">
              <li><strong className="text-white">Merchant Order Records:</strong> Payment IDs, gross amounts, currency (INR), order dates, customer email/contact identifiers.</li>
              <li><strong className="text-white">Gateway Settlements:</strong> Settlement batch IDs, net amounts, fee deductions (MDR and 18% GST), settlement timestamps.</li>
              <li><strong className="text-white">Bank Statement Credits:</strong> Unique Transaction References (UTRs), credit amounts, narration strings, value dates.</li>
            </ul>
            <p>
              This data is parsed directly within your client browser using local parsers (<code className="text-[#a5b4fc] font-mono">PapaParse</code> and <code className="text-[#a5b4fc] font-mono">fast-xml-parser</code>).
              It is never stored on external disk or sent to a database backend.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-[#818cf8]" />
              <span>2. AI Exception Analysis & Third-Party Services</span>
            </h3>
            <p>
              When a user explicitly triggers <strong className="text-white">&quot;Request AI Analysis&quot;</strong> on an unresolved exception record:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94a3b8]">
              <li>
                The individual exception record is transmitted via HTTPS POST to <code className="text-[#a5b4fc] font-mono">/api/analyze-exception</code>.
              </li>
              <li>
                In default deployment mode, this endpoint evaluates the exception using a <strong className="text-white">deterministic offline rule engine</strong> with zero external network transmission.
              </li>
              <li>
                If provider mode is configured with Google Gemini API credentials, the exception context is routed to Google Gemini 2.5 Flash for operational checklist synthesis. Under Google Cloud AI terms, data sent via enterprise Gemini API endpoints is not used to train foundation models.
              </li>
              <li>
                Server logs are strictly redacted: transaction amounts, payment IDs, UTRs, and raw payload text are never written to server log streams.
              </li>
            </ul>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>3. Cookies, Storage, and Tracking Inventory</span>
            </h3>
            <p>
              In accordance with ePrivacy Directive and GDPR standards:
            </p>
            <div className="border border-white/10 rounded-xl overflow-hidden font-mono text-xs">
              <div className="bg-[#141b2b] px-4 py-2 text-white font-semibold flex justify-between">
                <span>Mechanism</span>
                <span>Usage in ShaRecon AI</span>
              </div>
              <div className="px-4 py-2 border-t border-white/5 flex justify-between text-[#94a3b8]">
                <span>HTTP Tracking Cookies</span>
                <span className="text-[#10b981]">None (0 cookies set)</span>
              </div>
              <div className="px-4 py-2 border-t border-white/5 flex justify-between text-[#94a3b8]">
                <span>Browser LocalStorage / SessionStorage</span>
                <span className="text-[#10b981]">None (0 keys stored)</span>
              </div>
              <div className="px-4 py-2 border-t border-white/5 flex justify-between text-[#94a3b8]">
                <span>Third-Party Analytics (GA, PostHog, Pixels)</span>
                <span className="text-[#10b981]">None (Zero tracking scripts)</span>
              </div>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Because no non-essential cookies or persistent user trackers are deployed, no decorative cookie consent banner is presented.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>4. User Control & Data Deletion</span>
            </h3>
            <p>
              You maintain full sovereignty over your data at all times:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94a3b8]">
              <li><strong className="text-white">Immediate Purge:</strong> Click &quot;Reset Session&quot; in the header, or reload your browser, to destroy all loaded statements and audit events from memory.</li>
              <li><strong className="text-white">Export Package:</strong> You can download your complete session audit package as a cryptographically signed JSON manifest and CSV audit trail at any point prior to closing the session.</li>
            </ul>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>5. Unresolved Legal Inquiries & Contact</span>
            </h3>
            <p className="text-[#94a3b8]">
              ShaRecon AI is an open prototype developed for the Razorpay AI Buildathon (AI Finance Controller Track).
              For enterprise deployment inquiries, data protection impact assessments (DPIA), or source audits, review the open source repository at{' '}
              <a
                href="https://github.com/skmdshariff143-ai/sharecon-ai"
                target="_blank"
                rel="noreferrer"
                className="text-[#818cf8] hover:underline"
              >
                github.com/skmdshariff143-ai/sharecon-ai
              </a>.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748b]">
          <div>© 2026 ShaRecon AI • All Rights Reserved</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Control Center</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

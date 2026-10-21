import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, AlertOctagon, Scale, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions — ShaRecon AI',
  description: 'Terms of service, usage limitations, intellectual property, and disclaimers for ShaRecon AI.',
};

export default function TermsPage() {
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
            <Scale className="w-4 h-4 text-[#818cf8]" />
            <span>Legal Framework</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Terms & Conditions of Use
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Effective Date: October 21, 2026 • Version 1.0 (Buildathon Deployment)
          </p>
        </header>

        {/* Essential Advisory Disclaimer */}
        <div className="bg-[#1e1518] border border-[#f43f5e]/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <h2 className="text-base font-semibold text-white">
                Critical Financial Advisory Disclaimer — Zero Fund Movement
              </h2>
              <p className="text-[#fecdd3] leading-relaxed">
                ShaRecon AI is an <strong className="text-white">operational decision-support and explainability tool</strong>.
                It does <strong className="text-white">NOT</strong> constitute a banking system, payment service provider, fund custodian,
                or automated settlement agent. It possesses zero capability and zero authorization to initiate bank transfers,
                debit merchant accounts, alter official banking ledgers of record, or execute fund movement.
              </p>
              <p className="text-[#fda4af] text-xs">
                All match scores, automated resolution recommendations, and AI exception diagnoses are advisory.
                Qualified finance controllers and human operators retain sole authority and responsibility for all financial entries and adjustments.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <section className="space-y-6 text-sm text-[#cbd5e1] leading-relaxed">
          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#818cf8]" />
              <span>1. Purpose & Intended Use</span>
            </h3>
            <p>
              ShaRecon AI was developed as an engineering submission for the <strong className="text-white">Razorpay AI Buildathon (Track 4: AI Finance Controller)</strong>.
              It is intended for technical evaluation, educational exploration, architectural benchmarking, and operational reconciliation simulations.
            </p>
            <p>
              You agree to use this software only for legitimate financial testing, evaluation, and operations within authorized boundaries.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>2. Intellectual Property & Open Licensing</span>
            </h3>
            <p>
              The source code, algorithms, bipartite collision solver, integer-paise financial arithmetic implementation,
              and user interface components are owned by the project author and licensed under open terms as specified in the
              GitHub repository. Third-party trademarks (including Razorpay, Google Gemini, and ISO 20022) belong to their respective owners
              and are referenced solely for compatibility and descriptive purposes.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#fbbf24]" />
              <span>3. Warranty Disclaimer</span>
            </h3>
            <p className="text-[#94a3b8]">
              THE APPLICATION AND ITS OUTPUTS ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTY OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, OR OPERATIONAL ACCURACY.
            </p>
            <p className="text-[#94a3b8]">
              While ShaRecon AI employs integer-paise arithmetic, 1-to-1 bipartite collision invariants, and deterministic scoring,
              the authors do not warrant that all edge cases in unstructured or malformed third-party financial statements will be resolved without human review.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>4. Limitation of Liability</span>
            </h3>
            <p className="text-[#94a3b8]">
              IN NO EVENT SHALL THE AUTHORS, CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
              SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT LIMITED TO FINANCIAL LOSSES, REVENUE LOSS,
              ACCOUNTING DISCREPANCIES, SYSTEM DOWNTIME, OR DATA CORRUPTION) ARISING IN ANY WAY OUT OF THE USE OF OR INABILITY
              TO USE THIS APPLICATION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
          </div>

          <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              <span>5. Governing Law & Inquiries</span>
            </h3>
            <p className="text-[#94a3b8]">
              These terms are governed by the laws of India. For commercial licensing, enterprise source code review, or operational integration inquiries,
              consult the project repository at{' '}
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
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

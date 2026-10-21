import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404: Page Not Found — ShaRecon AI',
  description: 'The requested page or financial workspace could not be located.',
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#070a10] text-[#f7f8fc] flex items-center justify-center p-6 selection:bg-[#7168ff] selection:text-white">
      <div className="max-w-md w-full bg-[#0e131f] border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl space-y-6">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#7168ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Code */}
        <div className="inline-flex p-3 rounded-2xl bg-[#141b2b] border border-white/10 text-[#818cf8] mb-2 shadow-inner">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#818cf8]">
            HTTP 404 • Resource Missing
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Workspace Not Found
          </h1>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            The requested route does not correspond to an active ledger, API endpoint, or reconciliation view.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#7168ff] hover:bg-[#6258f5] text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-[#7168ff]/20 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Control Center</span>
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center justify-center gap-2 bg-[#141b2b] hover:bg-white/10 text-[#94a3b8] hover:text-white font-medium text-xs py-2.5 px-4 rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5 text-[11px] text-[#64748b] flex items-center justify-center gap-2">
          <ArrowLeft className="w-3 h-3" />
          <span>All financial state resides in your local browser session</span>
        </div>
      </div>
    </main>
  );
}

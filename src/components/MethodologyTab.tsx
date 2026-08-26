import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Scale,
  CheckCircle2,
  Bot,
} from 'lucide-react';

export const MethodologyTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="elevated-card p-6 border-l-4 border-l-[#6366f1] bg-[#0e131f] border-white/8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 text-[#818cf8] flex items-center justify-center border border-[#6366f1]/25 shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#f8fafc] tracking-tight font-mono">
              Reconciliation Methodology &amp; Financial Safety Architecture
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
              Deterministic 3-way multi-criteria matching, integer-paise math, and bounded AI triage.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Source Reconciliation Overview */}
      <div className="elevated-card p-6 space-y-4 bg-[#0e131f] border-white/8 shadow-xl">
        <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-[#818cf8]" />
          <span>1. Three-Source Ledger Reconciliation Model</span>
        </h3>
        <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
          High-volume merchants operating on Razorpay receive funds through aggregated nodal settlement payouts rather than per-transaction bank deposits. ShaRecon AI executes candidate matching across three asynchronous transaction streams:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#6366f1] bg-[#080c14] border-white/8">
            <div className="font-bold text-[#f8fafc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
              Leg 1: Payment Orders
            </div>
            <p className="text-[#94a3b8] leading-normal font-sans">
              Captured customer payments recorded in merchant checkout database (<code className="text-[#a5b4fc]">pay_...</code>, <code className="text-[#a5b4fc]">order_...</code>).
            </p>
          </div>

          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#fbbf24] bg-[#080c14] border-white/8">
            <div className="font-bold text-[#f8fafc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>
              Leg 2: Nodal Settlements
            </div>
            <p className="text-[#94a3b8] leading-normal font-sans">
              Gateway settlement advice batches reflecting gateway fee deductions (2.0% - 3.5%) and 18% GST.
            </p>
          </div>

          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#2dd4bf] bg-[#080c14] border-white/8">
            <div className="font-bold text-[#f8fafc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span>
              Leg 3: Bank Statement Credits
            </div>
            <p className="text-[#94a3b8] leading-normal font-sans">
              Actual credit deposits appearing on merchant current account statements with UTR identifiers.
            </p>
          </div>
        </div>
      </div>

      {/* Integer-Paise Precision & 4-Factor Scoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integer Paise Math */}
        <div className="elevated-card p-6 space-y-3 bg-[#0e131f] border-white/8 shadow-xl">
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
            <Scale className="w-4 h-4 text-[#2dd4bf]" />
            <span>2. Integer-Paise Financial Math</span>
          </h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
            Standard floating-point representation in software is subject to binary rounding drift (e.g. <code className="text-[#f87171]">0.1 + 0.2 !== 0.3</code>).
          </p>
          <div className="bg-[#080c14] text-[#94a3b8] rounded-xl p-3.5 text-xs font-mono space-y-1 shadow-inner border border-white/8">
            <div className="text-[#2dd4bf] font-bold">Integer Representation:</div>
            <div>1 INR = 100 Integer Paise</div>
            <div>Gross ₹1,540.50 ➔ 154050 Paise</div>
            <div>Fee 2% + 18% GST ➔ 3081 Paise + 555 Paise</div>
            <div>Net Expected ➔ 150414 Paise (Exact)</div>
          </div>
          <p className="text-xs text-[#64748b] font-sans">
            All equality comparisons, fee deductions, and tolerance delta gates operate strictly in integer paise.
          </p>
        </div>

        {/* 4-Factor Scoring Breakdown */}
        <div className="elevated-card p-6 space-y-3 bg-[#0e131f] border-white/8 shadow-xl">
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
            <Cpu className="w-4 h-4 text-[#818cf8]" />
            <span>3. 4-Factor Scoring Engine (100 pts)</span>
          </h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
            Deterministic weighted linear scoring combining reference match, amount compatibility, date proximity, and UTR similarity.
          </p>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between p-2 bg-[#080c14] rounded-lg border border-white/8">
              <span className="text-[#818cf8] font-bold">Reference Key:</span>
              <span className="text-[#f8fafc]">40 points</span>
            </div>
            <div className="flex justify-between p-2 bg-[#080c14] rounded-lg border border-white/8">
              <span className="text-[#2dd4bf] font-bold">Amount Delta:</span>
              <span className="text-[#f8fafc]">35 points</span>
            </div>
            <div className="flex justify-between p-2 bg-[#080c14] rounded-lg border border-white/8">
              <span className="text-[#fbbf24] font-bold">Date SLA Window:</span>
              <span className="text-[#f8fafc]">15 points</span>
            </div>
            <div className="flex justify-between p-2 bg-[#080c14] rounded-lg border border-white/8">
              <span className="text-[#c084fc] font-bold">UTR Narration:</span>
              <span className="text-[#f8fafc]">10 points</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Boundary Card */}
      <div className="elevated-card p-6 space-y-3 bg-[#0e131f] border-white/8 shadow-xl">
        <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
          <Bot className="w-4 h-4 text-[#c084fc]" />
          <span>4. AI Architecture &amp; Financial Containment Safeguards</span>
        </h3>
        <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
          LLMs (including Gemini) are non-deterministic and must NEVER be placed in the critical path for financial matching, score generation, or fund movement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3.5 bg-[#080c14] border border-[#2dd4bf]/25 rounded-xl space-y-1.5">
            <div className="font-bold text-[#2dd4bf] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Deterministic Critical Path
            </div>
            <p className="text-[#94a3b8] font-sans">
              4-Factor scoring, 1-to-1 bipartite candidate collision avoidance, auto-reconciliation gates, and exposure computation are 100% deterministic TypeScript.
            </p>
          </div>

          <div className="p-3.5 bg-[#080c14] border border-[#c084fc]/25 rounded-xl space-y-1.5">
            <div className="font-bold text-[#c084fc] flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Bounded Advisory Copilot
            </div>
            <p className="text-[#94a3b8] font-sans">
              Gemini operates purely as an advisory intelligence layer for exception root cause explanation, missing document checklists, and offline fallback synthesis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

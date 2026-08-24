import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Scale,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Bot,
} from 'lucide-react';

export const MethodologyTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="elevated-card p-6 border-l-4 border-l-[#7168ff] bg-[#111620] border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7168ff]/15 text-[#7168ff] flex items-center justify-center border border-[#7168ff]/30 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#f7f8fc] tracking-tight font-mono">
              Reconciliation Methodology &amp; Financial Safety Architecture
            </h2>
            <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
              Deterministic 3-way multi-criteria matching, integer-paise math, and bounded AI triage.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Source Reconciliation Overview */}
      <div className="elevated-card p-6 space-y-4 bg-[#111620] border-white/10">
        <h3 className="text-sm font-bold text-[#f7f8fc] flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-[#7168ff]" />
          <span>1. Three-Source Ledger Reconciliation Model</span>
        </h3>
        <p className="text-xs text-[#a7afc0] leading-relaxed font-sans">
          High-volume merchants operating on Razorpay receive funds through aggregated nodal settlement payouts rather than per-transaction bank deposits. ShaRecon AI executes candidate matching across three asynchronous transaction streams:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#7168ff] bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#f7f8fc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#7168ff]"></span>
              Leg 1: Payment Orders
            </div>
            <p className="text-[#a7afc0] leading-normal font-sans">
              Captured customer payments recorded in merchant checkout database (<code className="text-[#c4b5fd]">pay_...</code>, <code className="text-[#c4b5fd]">order_...</code>).
            </p>
          </div>

          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#f5b942] bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#f7f8fc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#f5b942]"></span>
              Leg 2: Nodal Settlements
            </div>
            <p className="text-[#a7afc0] leading-normal font-sans">
              Gateway settlement advice batches reflecting gateway fee deductions (2.0% - 3.5%) and 18% GST.
            </p>
          </div>

          <div className="inset-panel p-4.5 rounded-xl space-y-1.5 border-t-2 border-t-[#2dd4bf] bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#f7f8fc] mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span>
              Leg 3: Bank Statement Credits
            </div>
            <p className="text-[#a7afc0] leading-normal font-sans">
              Actual credit deposits appearing on merchant current account statements with UTR identifiers.
            </p>
          </div>
        </div>
      </div>

      {/* Integer-Paise Precision & 4-Factor Scoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integer Paise Math */}
        <div className="elevated-card p-6 space-y-3 bg-[#111620] border-white/10">
          <h3 className="text-sm font-bold text-[#f7f8fc] flex items-center gap-2 font-mono">
            <Scale className="w-4 h-4 text-[#2dd4bf]" />
            <span>2. Integer-Paise Financial Math</span>
          </h3>
          <p className="text-xs text-[#a7afc0] leading-relaxed font-sans">
            Standard floating-point representation in software is subject to binary rounding drift (e.g. <code className="text-[#ff6577]">0.1 + 0.2 !== 0.3</code>).
          </p>
          <div className="bg-[#070a10] text-[#a7afc0] rounded-xl p-3.5 text-xs font-mono space-y-1 shadow-inner border border-white/10">
            <div className="text-[#2dd4bf] font-bold">Integer Representation:</div>
            <div>1 INR = 100 Integer Paise</div>
            <div>Gross ₹1,540.50 ➔ 154050 Paise</div>
            <div>Fee 2% + 18% GST ➔ 3081 Paise + 555 Paise</div>
            <div>Net Expected ➔ 150414 Paise (Exact)</div>
          </div>
          <p className="text-xs text-[#7d879b] font-sans">
            All equality comparisons, fee deductions, and tolerance delta gates operate strictly in integer paise.
          </p>
        </div>

        {/* 4-Factor Scoring Breakdown */}
        <div className="elevated-card p-6 space-y-3 bg-[#111620] border-white/10">
          <h3 className="text-sm font-bold text-[#f7f8fc] flex items-center gap-2 font-mono">
            <Cpu className="w-4 h-4 text-[#7168ff]" />
            <span>3. 4-Factor Deterministic Evidence Scoring</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c101a] border border-white/10">
              <span className="font-semibold text-[#f7f8fc]">Reference Match</span>
              <span className="font-mono font-bold text-[#7168ff]">40 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c101a] border border-white/10">
              <span className="font-semibold text-[#f7f8fc]">Amount Compatibility</span>
              <span className="font-mono font-bold text-[#7168ff]">35 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c101a] border border-white/10">
              <span className="font-semibold text-[#f7f8fc]">Date Window Proximity (T+0 to T+3)</span>
              <span className="font-mono font-bold text-[#7168ff]">15 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c101a] border border-white/10">
              <span className="font-semibold text-[#f7f8fc]">UTR &amp; Token Description Overlap</span>
              <span className="font-mono font-bold text-[#7168ff]">10 Points Max</span>
            </div>
          </div>
          <p className="text-[11px] text-[#7d879b] font-sans">
            Records scoring &ge; 85% without discrepancies auto-reconcile. Scores between 50% - 84% route to the review queue.
          </p>
        </div>
      </div>

      {/* Safety Safeguards & Bounded AI */}
      <div className="elevated-card p-6 space-y-4 bg-[#111620] border-white/10">
        <h3 className="text-sm font-bold text-[#f7f8fc] flex items-center gap-2 font-mono">
          <Lock className="w-4 h-4 text-[#f5b942]" />
          <span>4. Governance, Collision Safeguards &amp; Non-Authoritative AI</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="inset-panel p-4 rounded-xl space-y-1 bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#2dd4bf] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 1-to-1 Collision Lock
            </div>
            <p className="text-[#a7afc0] font-sans">
              Prevents duplicate settlement advices or bank credit lines from being assigned to multiple payment orders.
            </p>
          </div>

          <div className="inset-panel p-4 rounded-xl space-y-1 bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#f5b942] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Safety Circuit Breaker
            </div>
            <p className="text-[#a7afc0] font-sans">
              Halts automated reconciliation if the batch anomaly rate exceeds 35%, preventing catastrophic batch errors.
            </p>
          </div>

          <div className="inset-panel p-4 rounded-xl space-y-1 bg-[#0c101a] border-white/10">
            <div className="font-bold text-[#a78bfa] flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Advisory-Only AI
            </div>
            <p className="text-[#a7afc0] font-sans">
              Gemini operates strictly as an explainability copilot. It cannot move money, alter IDs, or modify match scores.
            </p>
          </div>
        </div>
      </div>

      {/* Disclosures */}
      <div className="inset-panel p-5 rounded-2xl text-xs text-[#7d879b] space-y-2 bg-[#0c101a] border-white/10">
        <div className="font-bold text-[#a7afc0] uppercase tracking-wider text-[10px] font-mono">
          Prototype Disclosures &amp; Limitations
        </div>
        <ul className="list-disc list-inside space-y-1 leading-relaxed font-sans">
          <li><strong>Synthetic Simulation</strong>: All transaction records, payment IDs, and bank statement lines are synthetic simulations created for evaluation purposes.</li>
          <li><strong>Zero Real Money Movement</strong>: The application is an analytical controller prototype and does not execute real bank transfers or touch live Razorpay balances.</li>
          <li><strong>Session-Based State</strong>: Reviewer decisions and uploaded CSVs persist in client session memory; production implementation would connect to a durable PostgreSQL/Ledger store.</li>
        </ul>
      </div>
    </div>
  );
};

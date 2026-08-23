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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Reconciliation Methodology &amp; Financial Safety Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic 3-way multi-criteria matching, integer-paise math, and bounded AI triage.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Source Reconciliation Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          1. Three-Source Ledger Reconciliation Model
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          High-volume merchants operating on Razorpay receive funds through aggregated nodal settlement payouts rather than per-transaction bank deposits. ShaRecon AI executes candidate matching across three asynchronous transaction streams:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Leg 1: Payment Orders
            </div>
            <p className="text-slate-600 leading-normal">
              Captured customer payments recorded in merchant checkout database (`pay_...`, `order_...`).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Leg 2: Nodal Settlements
            </div>
            <p className="text-slate-600 leading-normal">
              Gateway settlement advice batches reflecting gateway fee deductions (2.0% - 3.5%) and 18% GST.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Leg 3: Bank Statement Credits
            </div>
            <p className="text-slate-600 leading-normal">
              Actual credit deposits appearing on merchant current account statements with UTR identifiers.
            </p>
          </div>
        </div>
      </div>

      {/* Integer-Paise Precision & 4-Factor Scoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integer Paise Math */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            2. Integer-Paise Financial Math
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standard floating-point representation in software is subject to binary rounding drift (e.g. <code>0.1 + 0.2 !== 0.3</code>).
          </p>
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs font-mono space-y-1">
            <div className="text-emerald-400 font-bold">Integer Representation:</div>
            <div>1 INR = 100 Integer Paise</div>
            <div>Gross ₹1,540.50 ➔ 154050 Paise</div>
            <div>Fee 2% + 18% GST ➔ 3081 Paise + 555 Paise</div>
            <div>Net Expected ➔ 150414 Paise (Exact)</div>
          </div>
          <p className="text-xs text-slate-500">
            All equality comparisons, fee deductions, and tolerance delta gates operate strictly in integer paise.
          </p>
        </div>

        {/* 4-Factor Scoring Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            3. 4-Factor Deterministic Evidence Scoring
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">Reference Match</span>
              <span className="font-mono font-bold text-blue-700">40 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">Amount Compatibility</span>
              <span className="font-mono font-bold text-blue-700">35 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">Date Window Proximity (T+0 to T+3)</span>
              <span className="font-mono font-bold text-blue-700">15 Points Max</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">UTR &amp; Token Description Overlap</span>
              <span className="font-mono font-bold text-blue-700">10 Points Max</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Records scoring \(\ge 85\%\) without discrepancies auto-reconcile. Scores between \(50\% - 84\%\) route to the review queue.
          </p>
        </div>
      </div>

      {/* Safety Safeguards & Bounded AI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600" />
          4. Governance, Collision Safeguards &amp; Non-Authoritative AI
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> 1-to-1 Collision Lock
            </div>
            <p className="text-slate-600">
              Prevents duplicate settlement advices or bank credit lines from being assigned to multiple payment orders.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="w-4 h-4" /> Safety Circuit Breaker
            </div>
            <p className="text-slate-600">
              Halts automated reconciliation if the batch anomaly rate exceeds 35%, preventing catastrophic batch errors.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-violet-700">
              <Bot className="w-4 h-4" /> Advisory-Only AI
            </div>
            <p className="text-slate-600">
              Gemini operates strictly as an explainability copilot. It cannot move money, alter IDs, or modify match scores.
            </p>
          </div>
        </div>
      </div>

      {/* Disclosures */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-500 space-y-2">
        <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          Prototype Disclosures &amp; Limitations
        </div>
        <ul className="list-disc list-inside space-y-1 leading-relaxed">
          <li><strong>Synthetic Simulation</strong>: All transaction records, payment IDs, and bank statement lines are synthetic simulations created for evaluation purposes.</li>
          <li><strong>Zero Real Money Movement</strong>: The application is an analytical controller prototype and does not execute real bank transfers or touch live Razorpay balances.</li>
          <li><strong>Session-Based State</strong>: Reviewer decisions and uploaded CSVs persist in client session memory; production implementation would connect to a durable PostgreSQL/Ledger store.</li>
        </ul>
      </div>
    </div>
  );
};

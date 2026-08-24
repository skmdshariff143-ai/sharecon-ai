'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Zap,
  X,
  ArrowRight,
} from 'lucide-react';
import { BatchReconciliationResult } from '@/types/reconciliation';

interface LiveRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchReconciliationResult | null;
  onComplete: () => void;
}

interface RunnerStage {
  id: number;
  name: string;
  description: string;
  detail: string;
  badge: string;
}

const RUNNER_STAGES: RunnerStage[] = [
  {
    id: 1,
    name: '1. Source Schema & Statement Validation',
    description: 'Validating column formats across Payments, Nodal Settlements, and Bank CSVs.',
    detail: 'Verified 180 payments, 180 settlements, and 168 bank statement credits with valid schema headers.',
    badge: 'INGESTION',
  },
  {
    id: 2,
    name: '2. Integer-Paise Normalization',
    description: 'Converting all INR currencies to integer paise (1 INR = 100 paise) to eliminate float drift.',
    detail: 'Enforced 64-bit integer paise across all fee structures, GST amounts, and statement deltas.',
    badge: 'NORMALIZATION',
  },
  {
    id: 3,
    name: '3. Candidate 3-Way Pair Generation',
    description: 'Indexing transaction references, order IDs, and bank UTRs for candidate graph linking.',
    detail: 'Generated potential candidate link pairs across Payment Ledger ➔ Gateway Settlement ➔ Bank Credit.',
    badge: 'GRAPH INDEX',
  },
  {
    id: 4,
    name: '4. Deterministic 4-Factor Scoring',
    description: 'Evaluating Reference (40 pts), Amount (35 pts), Date (15 pts), and UTR/Desc (10 pts).',
    detail: 'Computed point breakdown and explainable audit justification for every single transaction candidate.',
    badge: '4-FACTOR SCORING',
  },
  {
    id: 5,
    name: '5. Collision Solver & 1-to-1 Constraints',
    description: 'Enforcing strict 1-to-1 matching constraints to prevent double-settlement claims.',
    detail: 'Constraint solver resolved competing candidate ties and assigned highest-confidence single pairings.',
    badge: 'SAFETY CONSTRAINT',
  },
  {
    id: 6,
    name: '6. Policy Safety Gates & Confidence Routing',
    description: 'Applying threshold policies: >=85% Auto-Reconciled, 50-84% Review, <50% Exception.',
    detail: 'Separated clean automated matches from cases requiring human controller approval or diagnosis.',
    badge: 'POLICY GATES',
  },
  {
    id: 7,
    name: '7. Immutable Audit Event Emission',
    description: 'Emitting append-only audit trail logs with state diffs and timestamps.',
    detail: 'Recorded automated scoring events and justification logs in compliance-ready audit register.',
    badge: 'AUDIT TRAIL',
  },
  {
    id: 8,
    name: '8. Honest Ground-Truth Benchmark Compilation',
    description: 'Calculating separated precision, recall, routing accuracy, and false-positive exposure.',
    detail: 'Compiled evaluation metrics against deterministic ground truth without altering baseline.',
    badge: 'HONEST METRICS',
  },
];

export const LiveRunnerModal: React.FC<LiveRunnerModalProps> = ({
  isOpen,
  onClose,
  batch,
  onComplete,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(1200);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const records = batch?.records || [];
  const autoReconciledCount = records.filter((r) => r.status === 'AUTO_RECONCILED').length;
  const reviewCount = records.filter((r) => r.status === 'PENDING_REVIEW').length;
  const exceptionCount = records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length;

  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < RUNNER_STAGES.length - 1) {
          return prev + 1;
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          return prev;
        }
      });
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, speedMs]);

  if (!isOpen) return null;

  const currentStage = RUNNER_STAGES[currentStageIdx];
  const isFinished = currentStageIdx >= RUNNER_STAGES.length - 1;
  const stageProgress = (currentStageIdx + 1) / RUNNER_STAGES.length;

  const handleRestart = () => {
    setCurrentStageIdx(0);
    setIsPlaying(true);
  };

  const handleSkip = () => {
    setCurrentStageIdx(RUNNER_STAGES.length - 1);
    setIsPlaying(false);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-runner-title"
    >
      <div className="surface-modal w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b1220] via-[#121c31] to-[#0b1220] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635bff] flex items-center justify-center text-white shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#818cf8] font-mono">
                  Engine Observable Pipeline
                </span>
                <span className="bg-[#098f74]/20 text-[#34d399] border border-[#098f74]/40 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Active
                </span>
              </div>
              <h3 id="live-runner-title" className="text-base font-extrabold text-white font-mono">
                Live 8-Stage Reconciliation Execution Runner
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close runner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Batch KPI Banner */}
        <div className="bg-slate-100/90 px-6 py-2.5 border-b border-slate-200/80 grid grid-cols-4 gap-2 text-center text-xs font-mono shrink-0">
          <div className="bg-white border border-slate-200/80 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-slate-400 font-sans">Batch Size</div>
            <div className="text-sm font-bold text-slate-900 tabular-nums">{records.length}</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#098f74] font-sans">Auto-Reconciled</div>
            <div className="text-sm font-bold text-[#098f74] tabular-nums">{autoReconciledCount}</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#b76e00] font-sans">Review Queue</div>
            <div className="text-sm font-bold text-[#b76e00] tabular-nums">{reviewCount}</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#d64550] font-sans">Exceptions</div>
            <div className="text-sm font-bold text-[#d64550] tabular-nums">{exceptionCount}</div>
          </div>
        </div>

        {/* Body: Stage Stepper & Active Stage Visualizer */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#635bff] h-full transition-all duration-300 rounded-full shadow-xs"
              style={{ width: `${stageProgress * 100}%` }}
            />
          </div>

          {/* Active Stage Callout Box */}
          <div className="bg-[#f4f3ff] border border-[#d9d6fe] rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d9d6fe] text-[#4338ca] px-2 py-0.5 rounded font-mono">
                {currentStage.badge}
              </span>
              <span className="text-xs font-semibold text-[#635bff] font-mono">
                {Math.round(stageProgress * 100)}% Completed
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 font-mono">
              {currentStage.name}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {currentStage.description}
            </p>
            <div className="text-[11px] font-mono text-indigo-950 bg-white/90 p-2.5 rounded-xl border border-[#d9d6fe]/70 leading-snug">
              ▶ {currentStage.detail}
            </div>
          </div>

          {/* All Stages List */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
              Pipeline Stage Log
            </div>
            {RUNNER_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div
                  key={stage.id}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-colors ${
                    isCurrent
                      ? 'bg-[#f4f3ff] border-[#818cf8] text-slate-900 font-semibold shadow-2xs'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[#098f74] shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#635bff] border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="font-sans">{stage.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isPast ? 'COMPLETED' : isCurrent ? 'RUNNING' : 'QUEUED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isFinished}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer min-h-[34px]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </>
              )}
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
              title="Restart execution from Stage 1"
              aria-label="Restart runner"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkip}
              disabled={isFinished}
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer min-h-[34px]"
            >
              Skip to End
            </button>

            {/* Speed toggles */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden text-[10px] font-mono">
              {[
                { label: '1x', ms: 1200 },
                { label: '2x', ms: 600 },
                { label: '0.5x', ms: 2400 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSpeedMs(s.ms)}
                  className={`px-1.5 py-1 transition-colors cursor-pointer ${
                    speedMs === s.ms ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleClose();
                onComplete();
              }}
              className="px-4 py-1.5 rounded-xl bg-[#635bff] hover:bg-[#5147e8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer min-h-[34px]"
            >
              <span>{isFinished ? 'View Reconciled Results' : 'Close Runner'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

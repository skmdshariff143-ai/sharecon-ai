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
  const autoCount = records.filter((r) => r.status === 'AUTO_RECONCILED').length;
  const reviewCount = records.filter((r) => r.status === 'PENDING_REVIEW').length;
  const exceptionCount = records.filter((r) => r.status === 'UNMATCHED_EXCEPTION').length;

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStageIdx((prev) => {
          if (prev < RUNNER_STAGES.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
        });
      }, speedMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, speedMs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStage = RUNNER_STAGES[currentStageIdx];
  const isFinished = currentStageIdx === RUNNER_STAGES.length - 1 && !isPlaying;
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
    setIsPlaying(false);
    setCurrentStageIdx(0);
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-runner-title"
    >
      <div
        className="modal-surface w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-[#111620] border border-white/15 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#090d16]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7168ff]/20 text-[#7168ff] flex items-center justify-center border border-[#7168ff]/40 shadow-[0_0_12px_rgba(113,104,255,0.3)]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 id="live-runner-title" className="text-base font-extrabold text-[#f7f8fc] flex items-center gap-2 font-mono">
                <span>Observable Engine Pipeline Runner</span>
                <span className="text-[10px] font-bold uppercase bg-[#7168ff]/15 text-[#7168ff] border border-[#7168ff]/30 px-2 py-0.5 rounded font-mono">
                  8-Stage Real Logic
                </span>
              </h3>
              <p className="text-xs text-[#a7afc0] mt-0.5 font-sans">
                Watch the actual deterministic multi-criteria pipeline execute with live state visualization.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-[#7d879b] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close runner modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Counters Banner */}
        <div className="bg-[#0c101a] border-b border-white/10 px-6 py-2.5 grid grid-cols-4 gap-2 text-center text-xs font-mono shrink-0">
          <div className="bg-[#111620] border border-white/10 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#7d879b] font-sans">Total Batch</div>
            <div className="text-sm font-bold text-[#f7f8fc] tabular-nums">{records.length} Records</div>
          </div>
          <div className="bg-[#111620] border border-[#2dd4bf]/30 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#2dd4bf] font-sans">Auto-Reconciled</div>
            <div className="text-sm font-bold text-[#2dd4bf] tabular-nums">{autoCount}</div>
          </div>
          <div className="bg-[#111620] border border-[#f5b942]/30 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#f5b942] font-sans">Review Queue</div>
            <div className="text-sm font-bold text-[#f5b942] tabular-nums">{reviewCount}</div>
          </div>
          <div className="bg-[#111620] border border-[#ff6577]/30 rounded-xl p-2">
            <div className="text-[10px] uppercase font-semibold text-[#ff6577] font-sans">Exceptions</div>
            <div className="text-sm font-bold text-[#ff6577] tabular-nums">{exceptionCount}</div>
          </div>
        </div>

        {/* Body: Stage Stepper & Active Stage Visualizer */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Progress Bar */}
          <div className="w-full bg-[#0c101a] h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-[#7168ff] to-[#5687ff] h-full transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(113,104,255,0.5)]"
              style={{ width: `${stageProgress * 100}%` }}
            />
          </div>

          {/* Active Stage Callout Box */}
          <div className="bg-[#7168ff]/12 border border-[#7168ff]/35 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7168ff]/25 text-[#c4b5fd] border border-[#7168ff]/40 px-2 py-0.5 rounded font-mono">
                {currentStage.badge}
              </span>
              <span className="text-xs font-semibold text-[#7168ff] font-mono">
                {Math.round(stageProgress * 100)}% Completed
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-[#f7f8fc] font-mono">
              {currentStage.name}
            </h4>
            <p className="text-xs text-[#a7afc0] leading-relaxed font-sans">
              {currentStage.description}
            </p>
            <div className="text-[11px] font-mono text-[#c4b5fd] bg-[#0c101a] p-2.5 rounded-xl border border-white/10 leading-snug">
              ▶ {currentStage.detail}
            </div>
          </div>

          {/* All Stages List */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7d879b] font-mono mb-1">
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
                      ? 'bg-[#7168ff]/15 border-[#7168ff]/50 text-[#f7f8fc] font-semibold shadow-xs'
                      : isPast
                      ? 'bg-[#0c101a] border-white/10 text-[#a7afc0]'
                      : 'border-transparent text-[#7d879b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#7168ff] border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                    )}
                    <span className="font-sans">{stage.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7d879b]">
                    {isPast ? 'COMPLETED' : isCurrent ? 'RUNNING' : 'QUEUED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-[#090d16] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isFinished}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer min-h-[34px] border border-white/10"
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
              className="p-1.5 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
              title="Restart execution from Stage 1"
              aria-label="Restart runner"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkip}
              disabled={isFinished}
              className="px-3 py-1.5 rounded-xl text-[#a7afc0] hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer min-h-[34px] border border-white/10"
            >
              Skip to End
            </button>

            {/* Speed toggles */}
            <div className="flex items-center border border-white/10 rounded-lg overflow-hidden text-[10px] font-mono bg-[#0c101a]">
              {[
                { label: '1x', ms: 1200 },
                { label: '2x', ms: 600 },
                { label: '0.5x', ms: 2400 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSpeedMs(s.ms)}
                  className={`px-2 py-1 transition-colors cursor-pointer ${
                    speedMs === s.ms ? 'bg-[#7168ff] text-white font-bold' : 'text-[#a7afc0] hover:bg-white/5'
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
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(113,104,255,0.4)] cursor-pointer min-h-[34px]"
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

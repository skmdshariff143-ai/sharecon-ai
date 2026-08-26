'use client';

import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { EngineConfig } from '@/types/reconciliation';

interface SettingsModalProps {
  config: EngineConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: EngineConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const [highThreshold, setHighThreshold] = useState(config.highConfidenceThreshold);
  const [medThreshold, setMedThreshold] = useState(config.mediumConfidenceThreshold);
  const [maxDateDelta, setMaxDateDelta] = useState(config.maxDateDeltaDays);
  const [feeTolerance, setFeeTolerance] = useState(config.feeTolerancePaise / 100);
  const [circuitBreaker, setCircuitBreaker] = useState(config.circuitBreakerThresholdPercent);
  const [dryRun, setDryRun] = useState(config.dryRun);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      highConfidenceThreshold: Number(highThreshold),
      mediumConfidenceThreshold: Number(medThreshold),
      maxDateDeltaDays: Number(maxDateDelta),
      feeTolerancePaise: Math.round(Number(feeTolerance) * 100),
      circuitBreakerThresholdPercent: Number(circuitBreaker),
      dryRun,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-fade-in"
    >
      <div className="modal-surface max-w-lg w-full p-6 shadow-2xl bg-[#141b2b] border border-white/12 rounded-2xl animate-scale-up">
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6366f1]/15 text-[#818cf8] rounded-xl border border-[#6366f1]/30 shadow-[0_0_8px_rgba(99,102,241,0.25)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-[#f8fafc] font-mono">
                Reconciliation Policy Settings
              </h2>
              <p className="text-xs text-[#94a3b8] font-sans">
                Fine-tune confidence score boundaries and risk tolerance thresholds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-sans">
          {/* High Confidence Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="high-threshold-input" className="font-semibold text-[#f8fafc]">
                Auto-Reconciliation Threshold (Score &ge; X)
              </label>
              <span className="font-mono font-bold text-[#2dd4bf]">{highThreshold}%</span>
            </div>
            <input
              id="high-threshold-input"
              type="range"
              min={70}
              max={95}
              value={highThreshold}
              onChange={(e) => setHighThreshold(Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
            <p className="text-[11px] text-[#64748b]">
              Matches scoring above this threshold are automatically approved without human intervention.
            </p>
          </div>

          {/* Medium Confidence Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="med-threshold-input" className="font-semibold text-[#f8fafc]">
                Review Queue Lower Bound (Score &ge; Y)
              </label>
              <span className="font-mono font-bold text-[#fbbf24]">{medThreshold}%</span>
            </div>
            <input
              id="med-threshold-input"
              type="range"
              min={30}
              max={65}
              value={medThreshold}
              onChange={(e) => setMedThreshold(Number(e.target.value))}
              className="w-full accent-[#fbbf24] cursor-pointer"
            />
            <p className="text-[11px] text-[#64748b]">
              Matches scoring below this are flagged as unmatched exceptions; between Y and X go to Review Queue.
            </p>
          </div>

          {/* Date Window */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="date-window-input" className="font-semibold text-[#f8fafc]">
                Settlement Window SLA (Max Days)
              </label>
              <span className="font-mono font-bold text-[#818cf8]">{maxDateDelta} Days</span>
            </div>
            <input
              id="date-window-input"
              type="range"
              min={1}
              max={7}
              value={maxDateDelta}
              onChange={(e) => setMaxDateDelta(Number(e.target.value))}
              className="w-full accent-[#6366f1] cursor-pointer"
            />
            <p className="text-[11px] text-[#64748b]">
              Maximum calendar days elapsed between captured payment and bank statement credit before penalty.
            </p>
          </div>

          {/* Fee Tolerance */}
          <div className="space-y-1">
            <label htmlFor="fee-tolerance-input" className="font-semibold text-[#f8fafc] block">
              Fee Difference Tolerance (INR)
            </label>
            <input
              id="fee-tolerance-input"
              type="number"
              step="0.1"
              min="0"
              value={feeTolerance}
              onChange={(e) => setFeeTolerance(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
            />
            <p className="text-[11px] text-[#64748b]">
              Acceptable rounding delta between expected gateway fee and actual advice deduction (₹0.00 = strict).
            </p>
          </div>

          {/* Circuit Breaker */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="circuit-breaker-input" className="font-semibold text-[#f8fafc]">
                Safety Circuit Breaker Threshold (% Unmatched Stop)
              </label>
              <span className="font-mono font-bold text-[#f87171]">{circuitBreaker}%</span>
            </div>
            <input
              id="circuit-breaker-input"
              type="range"
              min={10}
              max={50}
              value={circuitBreaker}
              onChange={(e) => setCircuitBreaker(Number(e.target.value))}
              className="w-full accent-[#f87171] cursor-pointer"
            />
            <p className="text-[11px] text-[#64748b]">
              Halts automated settlement batches if unmatched exception volume exceeds this threshold.
            </p>
          </div>

          {/* Dry Run Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#080c14] rounded-xl border border-white/8">
            <div>
              <span className="font-semibold text-[#f8fafc] block">Dry-Run Simulation Mode</span>
              <p className="text-[11px] text-[#64748b]">Simulate reconciliation matches without committing live state.</p>
            </div>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4 accent-[#2dd4bf] cursor-pointer"
              aria-label="Toggle dry-run simulation mode"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#080c14] hover:bg-[#1a2236] border border-white/8 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
          >
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
};

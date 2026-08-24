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
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="modal-surface max-w-lg w-full p-6 shadow-2xl bg-[#111620] border border-white/15 rounded-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7168ff]/20 text-[#7168ff] rounded-xl border border-[#7168ff]/40 shadow-[0_0_8px_rgba(113,104,255,0.3)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-base font-extrabold text-[#f7f8fc] font-mono">
                Reconciliation Engine Settings
              </h3>
              <p className="text-xs text-[#a7afc0] font-sans">
                Calibrate thresholds and automated matching safety gates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7d879b] hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          {/* High Confidence Threshold */}
          <div>
            <div className="flex justify-between font-semibold text-[#f7f8fc] mb-1">
              <span>Auto-Reconcile Threshold (High Confidence)</span>
              <span className="text-[#7168ff] font-mono font-bold">{highThreshold}%</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-1.5 font-sans">
              Matches with confidence score ≥ this value are eligible for automatic reconciliation.
            </p>
            <input
              type="range"
              min="70"
              max="98"
              step="1"
              value={highThreshold}
              onChange={(e) => setHighThreshold(Number(e.target.value))}
              className="w-full accent-[#7168ff] cursor-pointer"
            />
          </div>

          {/* Medium Confidence Threshold */}
          <div>
            <div className="flex justify-between font-semibold text-[#f7f8fc] mb-1">
              <span>Human Review Threshold (Medium Confidence)</span>
              <span className="text-[#f5b942] font-mono font-bold">{medThreshold}%</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-1.5 font-sans">
              Matches with scores between this value and High Threshold route to human reviewer triage.
            </p>
            <input
              type="range"
              min="30"
              max="80"
              step="1"
              value={medThreshold}
              onChange={(e) => setMedThreshold(Number(e.target.value))}
              className="w-full accent-[#f5b942] cursor-pointer"
            />
          </div>

          {/* Max Date Delta Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#f7f8fc] block mb-1">Max Settlement Lag (Days)</label>
              <input
                type="number"
                min="1"
                max="14"
                value={maxDateDelta}
                onChange={(e) => setMaxDateDelta(Number(e.target.value))}
                className="w-full bg-[#0c101a] border border-white/10 rounded-xl p-2 font-mono text-[#f7f8fc] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#f7f8fc] block mb-1">Fee Variance Tolerance (INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeTolerance}
                onChange={(e) => setFeeTolerance(Number(e.target.value))}
                className="w-full bg-[#0c101a] border border-white/10 rounded-xl p-2 font-mono text-[#f7f8fc] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff]"
              />
            </div>
          </div>

          {/* Circuit Breaker */}
          <div>
            <div className="flex justify-between font-semibold text-[#f7f8fc] mb-1">
              <span>Safety Circuit Breaker (Batch Anomaly Limit)</span>
              <span className="text-[#ff6577] font-mono font-bold">{circuitBreaker}%</span>
            </div>
            <p className="text-[11px] text-[#a7afc0] mb-1.5 font-sans">
              Halts batch automation if exception rate exceeds this threshold.
            </p>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={circuitBreaker}
              onChange={(e) => setCircuitBreaker(Number(e.target.value))}
              className="w-full accent-[#ff6577] cursor-pointer"
            />
          </div>

          {/* Dry-Run Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c101a] border border-white/10">
            <div>
              <div className="font-bold text-[#f7f8fc]">Dry-Run Simulation Mode</div>
              <p className="text-[11px] text-[#a7afc0] font-sans">
                Matches are simulated without emitting irreversible ledger write actions.
              </p>
            </div>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4 rounded text-[#7168ff] accent-[#7168ff] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#a7afc0] hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] transition-all shadow-[0_0_12px_rgba(113,104,255,0.4)] cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

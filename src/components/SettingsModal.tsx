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
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-base font-bold text-slate-900">
                Reconciliation Engine Settings
              </h3>
              <p className="text-xs text-slate-500">
                Calibrate thresholds and automated matching safety gates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          {/* High Confidence Threshold */}
          <div>
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Auto-Reconcile Threshold (High Confidence)</span>
              <span className="text-blue-600">{highThreshold}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Matches with confidence score ≥ this value are eligible for automatic reconciliation.
            </p>
            <input
              type="range"
              min="70"
              max="98"
              step="1"
              value={highThreshold}
              onChange={(e) => setHighThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Medium Confidence Threshold */}
          <div>
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Human Review Escalation Threshold (Medium Confidence)</span>
              <span className="text-amber-600">{medThreshold}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Matches scored between {medThreshold}% and {highThreshold - 1}% are routed to the review queue.
            </p>
            <input
              type="range"
              min="40"
              max="70"
              step="1"
              value={medThreshold}
              onChange={(e) => setMedThreshold(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Fee Variance Tolerance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Fee Tolerance (₹)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={feeTolerance}
                onChange={(e) => setFeeTolerance(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Allowed rounding difference in paise.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Max Date Window (Days)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={maxDateDelta}
                onChange={(e) => setMaxDateDelta(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Candidate lookup proximity SLA.
              </span>
            </div>
          </div>

          {/* Circuit Breaker Limit */}
          <div>
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Safety Circuit Breaker Anomaly Threshold</span>
              <span className="text-rose-600">{circuitBreaker}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-1.5">
              If batch anomaly rate exceeds this limit, automatic reconciliation halts immediately.
            </p>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={circuitBreaker}
              onChange={(e) => setCircuitBreaker(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Dry Run Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Dry-Run Simulation Mode</span>
              <span className="text-[11px] text-slate-500">
                Safely simulate decisions without finalizing live ledger state.
              </span>
            </div>
            <button
              onClick={() => setDryRun(!dryRun)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                dryRun ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-xs"></div>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            Save & Re-Score Batch
          </button>
        </div>
      </div>
    </div>
  );
};

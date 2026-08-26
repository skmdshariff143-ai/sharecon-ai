'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Ban, Flag, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  actionType?: 'APPROVE' | 'REJECT' | 'FLAG' | 'DANGER' | 'INFO';
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  actionType = 'INFO',
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        className="modal-surface max-w-md w-full p-6 shadow-2xl space-y-4 bg-[#141b2b] border border-white/12 rounded-2xl animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              actionType === 'APPROVE'
                ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/35'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/35'
                : actionType === 'FLAG'
                ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/35'
                : 'bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/35'
            }`}
          >
            {actionType === 'APPROVE' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : actionType === 'REJECT' ? (
              <Ban className="w-5 h-5" />
            ) : actionType === 'FLAG' ? (
              <Flag className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <h3 id="modal-title" className="text-base font-bold text-[#f8fafc] font-mono">
              {title}
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#080c14] hover:bg-[#1a2236] border border-white/8 rounded-xl transition-colors cursor-pointer min-h-[38px]"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 ${
              actionType === 'APPROVE'
                ? 'bg-[#2dd4bf] text-black hover:bg-[#14b8a6] shadow-[#2dd4bf]/20'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-[#f87171] hover:bg-[#ef4444] shadow-[#f87171]/20'
                : actionType === 'FLAG'
                ? 'bg-[#fbbf24] text-black hover:bg-[#f59e0b] shadow-[#fbbf24]/20'
                : 'bg-[#6366f1] hover:bg-[#4f46e5] shadow-[#6366f1]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

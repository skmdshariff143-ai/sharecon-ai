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

    // Focus confirm button when modal opens
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              actionType === 'APPROVE'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : actionType === 'FLAG'
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}
          >
            {actionType === 'APPROVE' && <CheckCircle2 className="w-5 h-5" />}
            {(actionType === 'REJECT' || actionType === 'DANGER') && (
              <Ban className="w-5 h-5" />
            )}
            {actionType === 'FLAG' && <Flag className="w-5 h-5" />}
            {actionType === 'INFO' && <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="flex-1">
            <h3
              id="modal-title"
              className="text-base font-bold text-slate-900 leading-tight"
            >
              {title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 ${
              actionType === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-rose-600 hover:bg-rose-700'
                : actionType === 'FLAG'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

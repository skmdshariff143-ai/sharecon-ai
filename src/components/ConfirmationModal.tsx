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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="modal-surface max-w-md w-full p-6 shadow-2xl space-y-4 bg-[#111620] border border-white/15 rounded-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              actionType === 'APPROVE'
                ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/40'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-[#ff6577]/20 text-[#ff6577] border border-[#ff6577]/40'
                : actionType === 'FLAG'
                ? 'bg-[#f5b942]/20 text-[#f5b942] border border-[#f5b942]/40'
                : 'bg-[#7168ff]/20 text-[#7168ff] border border-[#7168ff]/40'
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
              className="text-base font-extrabold text-[#f7f8fc] leading-tight font-mono"
            >
              {title}
            </h3>
            <p className="text-xs text-[#a7afc0] mt-1 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[#7d879b] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#a7afc0] hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer min-h-[38px]"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs min-h-[38px] ${
              actionType === 'APPROVE'
                ? 'bg-[#2dd4bf]/30 hover:bg-[#2dd4bf]/40 text-[#2dd4bf] border border-[#2dd4bf]/50'
                : actionType === 'REJECT' || actionType === 'DANGER'
                ? 'bg-[#ff6577]/20 hover:bg-[#ff6577]/30 text-[#ff6577] border border-[#ff6577]/40'
                : actionType === 'FLAG'
                ? 'bg-[#f5b942]/20 hover:bg-[#f5b942]/30 text-[#f5b942] border border-[#f5b942]/40'
                : 'bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Area */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl transition-all transform translate-y-0 text-xs backdrop-blur-md animate-fade-in ${
              toast.type === 'success'
                ? 'bg-[#141b2b]/95 text-[#f8fafc] border-[#2dd4bf]/35 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                : toast.type === 'error'
                ? 'bg-[#141b2b]/95 text-[#f8fafc] border-[#f87171]/35 shadow-[0_0_15px_rgba(248,113,113,0.2)]'
                : toast.type === 'warning'
                ? 'bg-[#141b2b]/95 text-[#f8fafc] border-[#fbbf24]/35 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : 'bg-[#141b2b]/95 text-[#f8fafc] border-[#6366f1]/35 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[#f87171]" />
              )}
              {toast.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-[#fbbf24]" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-[#818cf8]" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-[#f8fafc] font-mono">{toast.title}</div>
              {toast.description && (
                <div className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed font-sans">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#64748b] hover:text-white transition-colors p-0.5 rounded cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

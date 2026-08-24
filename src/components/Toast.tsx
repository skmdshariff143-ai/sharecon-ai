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
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl transition-all transform translate-y-0 text-xs backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[#111620]/95 text-[#f7f8fc] border-[#2dd4bf]/40 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                : toast.type === 'error'
                ? 'bg-[#111620]/95 text-[#f7f8fc] border-[#ff6577]/40 shadow-[0_0_15px_rgba(255,101,119,0.2)]'
                : toast.type === 'warning'
                ? 'bg-[#111620]/95 text-[#f7f8fc] border-[#f5b942]/40 shadow-[0_0_15px_rgba(245,185,66,0.2)]'
                : 'bg-[#111620]/95 text-[#f7f8fc] border-[#7168ff]/40 shadow-[0_0_15px_rgba(113,104,255,0.2)]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[#ff6577]" />
              )}
              {toast.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-[#f5b942]" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-[#7168ff]" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-[#f7f8fc] font-mono">{toast.title}</div>
              {toast.description && (
                <div className="text-[11px] text-[#a7afc0] mt-0.5 leading-relaxed font-sans">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#7d879b] hover:text-white transition-colors p-0.5 rounded cursor-pointer"
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

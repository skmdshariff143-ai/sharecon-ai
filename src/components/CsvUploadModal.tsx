'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
} from 'lucide-react';
import {
  parsePaymentsCsv,
  parseSettlementsCsv,
  parseBankTransactionsCsv,
  exportPaymentsCsv,
  exportSettlementsCsv,
  exportBankTransactionsCsv,
} from '@/lib/dataset/csv';
import { generateSyntheticDataset } from '@/lib/dataset/generator';
import { Payment, Settlement, BankTransaction } from '@/types/reconciliation';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (
    payments: Payment[],
    settlements: Settlement[],
    bankTransactions: BankTransaction[]
  ) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [parsedPayments, setParsedPayments] = useState<Payment[] | null>(null);
  const [parsedSettlements, setParsedSettlements] = useState<Settlement[] | null>(null);
  const [parsedBank, setParsedBank] = useState<BankTransaction[] | null>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'PAYMENTS' | 'SETTLEMENTS' | 'BANK'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (type === 'PAYMENTS') {
      const res = parsePaymentsCsv(text);
      if (res.errors.length > 0) {
        setValidationErrors((prev) => [
          ...prev,
          `Payments CSV: ${res.errors.length} validation errors found (e.g., Row ${res.errors[0].row}: ${res.errors[0].message})`,
        ]);
      }
      setParsedPayments(res.data);
    } else if (type === 'SETTLEMENTS') {
      const res = parseSettlementsCsv(text);
      if (res.errors.length > 0) {
        setValidationErrors((prev) => [
          ...prev,
          `Settlements CSV: ${res.errors.length} validation errors found (e.g., Row ${res.errors[0].row}: ${res.errors[0].message})`,
        ]);
      }
      setParsedSettlements(res.data);
    } else {
      const res = parseBankTransactionsCsv(text);
      if (res.errors.length > 0) {
        setValidationErrors((prev) => [
          ...prev,
          `Bank Transactions CSV: ${res.errors.length} validation errors found (e.g., Row ${res.errors[0].row}: ${res.errors[0].message})`,
        ]);
      }
      setParsedBank(res.data);
    }
  };

  const handleDownloadSample = (type: 'PAYMENTS' | 'SETTLEMENTS' | 'BANK') => {
    const sample = generateSyntheticDataset(42);
    let csvContent = '';
    let filename = '';

    if (type === 'PAYMENTS') {
      csvContent = exportPaymentsCsv(sample.payments);
      filename = 'sample_payments.csv';
    } else if (type === 'SETTLEMENTS') {
      csvContent = exportSettlementsCsv(sample.settlements);
      filename = 'sample_settlements.csv';
    } else {
      csvContent = exportBankTransactionsCsv(sample.bankTransactions);
      filename = 'sample_bank_statement.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    if (!parsedPayments || !parsedSettlements || !parsedBank) {
      setValidationErrors(['Please upload all three required CSV files to run 3-way reconciliation.']);
      return;
    }

    onUploadSuccess(parsedPayments, parsedSettlements, parsedBank);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="modal-surface max-w-xl w-full p-6 shadow-2xl space-y-4 bg-[#111620] border border-white/15 rounded-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7168ff]/20 text-[#7168ff] rounded-xl border border-[#7168ff]/40 shadow-[0_0_8px_rgba(113,104,255,0.3)]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 id="upload-modal-title" className="text-base font-extrabold text-[#f7f8fc] font-mono">
                Upload 3-Way Statement Files
              </h3>
              <p className="text-xs text-[#a7afc0] font-sans">
                Process external merchant payments, Razorpay settlements, and bank credits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7d879b] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Fields */}
        <div className="space-y-3.5 text-xs">
          {/* File 1: Payments */}
          <div className="p-3.5 border border-white/10 rounded-xl bg-[#0c101a]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#f7f8fc] flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-[#7168ff]" />
                1. Merchant Captured Payments CSV
              </span>
              <button
                onClick={() => handleDownloadSample('PAYMENTS')}
                className="text-[11px] text-[#7168ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'PAYMENTS')}
                className="text-xs text-[#a7afc0] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#7168ff]/20 file:text-[#c4b5fd] hover:file:bg-[#7168ff]/30 cursor-pointer"
              />
              {parsedPayments && (
                <span className="text-[11px] font-semibold text-[#2dd4bf] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedPayments.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* File 2: Settlements */}
          <div className="p-3.5 border border-white/10 rounded-xl bg-[#0c101a]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#f7f8fc] flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-[#f5b942]" />
                2. Razorpay Settlement Advices CSV
              </span>
              <button
                onClick={() => handleDownloadSample('SETTLEMENTS')}
                className="text-[11px] text-[#f5b942] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'SETTLEMENTS')}
                className="text-xs text-[#a7afc0] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#f5b942]/20 file:text-[#f5b942] hover:file:bg-[#f5b942]/30 cursor-pointer"
              />
              {parsedSettlements && (
                <span className="text-[11px] font-semibold text-[#2dd4bf] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedSettlements.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* File 3: Bank Transactions */}
          <div className="p-3.5 border border-white/10 rounded-xl bg-[#0c101a]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#f7f8fc] flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-[#2dd4bf]" />
                3. Bank Statement Transactions CSV
              </span>
              <button
                onClick={() => handleDownloadSample('BANK')}
                className="text-[11px] text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'BANK')}
                className="text-xs text-[#a7afc0] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#2dd4bf]/20 file:text-[#2dd4bf] hover:file:bg-[#2dd4bf]/30 cursor-pointer"
              />
              {parsedBank && (
                <span className="text-[11px] font-semibold text-[#2dd4bf] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedBank.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* Validation Errors Diagnostics */}
          {validationErrors.length > 0 && (
            <div className="bg-[#ff6577]/15 border border-[#ff6577]/35 rounded-xl p-3 text-[#ff6577] text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-[#ff6577]" />
                Validation Diagnostics
              </div>
              {validationErrors.map((err, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed font-sans">
                  • {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#a7afc0] hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer min-h-[36px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!parsedPayments || !parsedSettlements || !parsedBank}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#7168ff] to-[#5687ff] hover:from-[#5d53ea] hover:to-[#4375ea] text-white disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(113,104,255,0.4)] flex items-center gap-1.5 cursor-pointer min-h-[36px]"
          >
            <span>Process Reconciliation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

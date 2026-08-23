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
      csvContent = exportPaymentsCsv(sample.payments.slice(0, 20));
      filename = 'payments_sample.csv';
    } else if (type === 'SETTLEMENTS') {
      csvContent = exportSettlementsCsv(sample.settlements.slice(0, 20));
      filename = 'settlements_sample.csv';
    } else {
      csvContent = exportBankTransactionsCsv(sample.bankTransactions.slice(0, 20));
      filename = 'bank_transactions_sample.csv';
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
      setValidationErrors(['Please upload all three CSV files to execute 3-way reconciliation.']);
      return;
    }

    onUploadSuccess(parsedPayments, parsedSettlements, parsedBank);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload 3-Way Reconciliation Datasets</h3>
              <p className="text-xs text-slate-500">
                Upload payments, settlements, and bank statement CSV files.
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
          {/* File 1: Payments */}
          <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                1. Payments CSV
              </span>
              <button
                onClick={() => handleDownloadSample('PAYMENTS')}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'PAYMENTS')}
                className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {parsedPayments && (
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedPayments.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* File 2: Settlements */}
          <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                2. Razorpay Settlements CSV
              </span>
              <button
                onClick={() => handleDownloadSample('SETTLEMENTS')}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'SETTLEMENTS')}
                className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {parsedSettlements && (
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedSettlements.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* File 3: Bank Transactions */}
          <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                3. Bank Statement Transactions CSV
              </span>
              <button
                onClick={() => handleDownloadSample('BANK')}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Template
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'BANK')}
                className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              {parsedBank && (
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {parsedBank.length} rows valid
                </span>
              )}
            </div>
          </div>

          {/* Validation Errors Diagnostics */}
          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Validation Diagnostics
              </div>
              {validationErrors.map((err, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed">
                  • {err}
                </p>
              ))}
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={!parsedPayments || !parsedSettlements || !parsedBank}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Process Reconciliation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

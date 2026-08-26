'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
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

    try {
      const text = await file.text();
      if (type === 'PAYMENTS') {
        const res = parsePaymentsCsv(text);
        if (res.errors.length > 0) {
          setValidationErrors((prev) => [...prev, ...res.errors.map((e) => `Row ${e.row}: ${e.message}`)]);
        }
        setParsedPayments(res.data);
      } else if (type === 'SETTLEMENTS') {
        const res = parseSettlementsCsv(text);
        if (res.errors.length > 0) {
          setValidationErrors((prev) => [...prev, ...res.errors.map((e) => `Row ${e.row}: ${e.message}`)]);
        }
        setParsedSettlements(res.data);
      } else if (type === 'BANK') {
        const res = parseBankTransactionsCsv(text);
        if (res.errors.length > 0) {
          setValidationErrors((prev) => [...prev, ...res.errors.map((e) => `Row ${e.row}: ${e.message}`)]);
        }
        setParsedBank(res.data);
      }
      setValidationErrors([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setValidationErrors((prev) => [...prev, `Failed to parse ${type} CSV: ${msg}`]);
    }
  };

  const handleDownloadSample = (type: 'PAYMENTS' | 'SETTLEMENTS' | 'BANK') => {
    const sample = generateSyntheticDataset(20);
    let csv = '';
    let filename = '';

    if (type === 'PAYMENTS') {
      csv = exportPaymentsCsv(sample.payments);
      filename = 'sample_payments.csv';
    } else if (type === 'SETTLEMENTS') {
      csv = exportSettlementsCsv(sample.settlements);
      filename = 'sample_settlements.csv';
    } else {
      csv = exportBankTransactionsCsv(sample.bankTransactions);
      filename = 'sample_bank_statements.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    const errors: string[] = [];
    if (!parsedPayments || parsedPayments.length === 0) errors.push('Payments statement CSV is required.');
    if (!parsedSettlements || parsedSettlements.length === 0) errors.push('Settlements statement CSV is required.');
    if (!parsedBank || parsedBank.length === 0) errors.push('Bank statement CSV is required.');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onUploadSuccess(parsedPayments!, parsedSettlements!, parsedBank!);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-fade-in"
    >
      <div className="modal-surface max-w-2xl w-full p-6 shadow-2xl bg-[#141b2b] border border-white/12 rounded-2xl animate-scale-up space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6366f1]/15 text-[#818cf8] rounded-xl border border-[#6366f1]/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="csv-modal-title" className="text-base font-bold text-[#f8fafc] font-mono">
                Upload 3-Way Statement Files
              </h2>
              <p className="text-xs text-[#94a3b8] font-sans">
                Import CSV files for Payments, Settlements, and Bank Account statement records.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/25 rounded-xl space-y-1 text-xs text-[#f87171]">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Validation Issues
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3 Upload Dropzones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-sans">
          {/* Leg 1: Payments */}
          <div className="p-4 bg-[#080c14] border border-white/8 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between font-bold text-[#818cf8] font-mono mb-1">
                <span>1. Payments CSV</span>
                {parsedPayments && <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />}
              </div>
              <p className="text-[11px] text-[#64748b]">
                Captured payment records (payment_id, order_id, gross_amount, fee, tax).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block w-full text-center px-3 py-2 bg-[#141b2b] hover:bg-[#1a2236] text-[#94a3b8] hover:text-white border border-white/8 rounded-xl font-medium cursor-pointer transition-colors text-xs">
                <span>{parsedPayments ? `${parsedPayments.length} records loaded` : 'Select File'}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'PAYMENTS')}
                />
              </label>
              <button
                type="button"
                onClick={() => handleDownloadSample('PAYMENTS')}
                className="w-full text-center text-[10px] text-[#64748b] hover:text-[#94a3b8] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download Sample
              </button>
            </div>
          </div>

          {/* Leg 2: Settlements */}
          <div className="p-4 bg-[#080c14] border border-white/8 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between font-bold text-[#fbbf24] font-mono mb-1">
                <span>2. Settlements CSV</span>
                {parsedSettlements && <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />}
              </div>
              <p className="text-[11px] text-[#64748b]">
                Nodal gateway advice (settlement_id, payment_reference, settled_amount, utr).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block w-full text-center px-3 py-2 bg-[#141b2b] hover:bg-[#1a2236] text-[#94a3b8] hover:text-white border border-white/8 rounded-xl font-medium cursor-pointer transition-colors text-xs">
                <span>{parsedSettlements ? `${parsedSettlements.length} records loaded` : 'Select File'}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'SETTLEMENTS')}
                />
              </label>
              <button
                type="button"
                onClick={() => handleDownloadSample('SETTLEMENTS')}
                className="w-full text-center text-[10px] text-[#64748b] hover:text-[#94a3b8] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download Sample
              </button>
            </div>
          </div>

          {/* Leg 3: Bank Statements */}
          <div className="p-4 bg-[#080c14] border border-white/8 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between font-bold text-[#2dd4bf] font-mono mb-1">
                <span>3. Bank CSV</span>
                {parsedBank && <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />}
              </div>
              <p className="text-[11px] text-[#64748b]">
                Bank statement feed (bank_tx_id, credit_amount, utr, credited_at).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block w-full text-center px-3 py-2 bg-[#141b2b] hover:bg-[#1a2236] text-[#94a3b8] hover:text-white border border-white/8 rounded-xl font-medium cursor-pointer transition-colors text-xs">
                <span>{parsedBank ? `${parsedBank.length} records loaded` : 'Select File'}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'BANK')}
                />
              </label>
              <button
                type="button"
                onClick={() => handleDownloadSample('BANK')}
                className="w-full text-center text-[10px] text-[#64748b] hover:text-[#94a3b8] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download Sample
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/8">
          <span className="text-[11px] text-[#64748b] font-mono">
            Requires all 3 statement legs to execute deterministic 3-way reconciliation.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#080c14] hover:bg-[#1a2236] border border-white/8 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!parsedPayments || !parsedSettlements || !parsedBank}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] disabled:opacity-50 rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Reconcile Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

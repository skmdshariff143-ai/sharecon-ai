'use client';

import React, { useState, useRef } from 'react';
import {
  Bot,
  Send,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ReconciliationRecord } from '@/types/reconciliation';
import { formatINR } from '@/lib/money';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  recommendedAction?: string;
  suggestedNextSteps?: string[];
}

interface ExceptionAssistantPanelProps {
  record: ReconciliationRecord;
}

const PRESET_QUESTIONS = [
  'Why did this record fail reconciliation?',
  'Which field caused the mismatch?',
  'Is it safe to manually approve?',
  'What is the potential financial exposure?',
  'What should the finance controller check next?',
];

function buildDeterministicResponse(record: ReconciliationRecord, queryText: string): {
  text: string;
  action: string;
  nextSteps: string[];
} {
  const lower = queryText.toLowerCase();
  let text = '';
  let action = 'Verify statement with bank nodal relationship manager.';
  const nextSteps = ['Review 3-way UTR trace in Evidence Drawer', 'Cross-check nodal fee rate'];

  if (lower.includes('why') && (lower.includes('fail') || lower.includes('score'))) {
    text = `Record ${record.payment.paymentId} has confidence score ${record.confidence}% because ${record.explanation}. Category: ${record.exceptionType.replace(/_/g, ' ')}.`;
    action = 'Investigate reference or amount deviation.';
  } else if (lower.includes('field') || lower.includes('mismatch') || lower.includes('cause')) {
    if (record.exceptionType === 'MISSING_BANK_CREDIT') {
      text = `The primary missing field is Leg 3 (Bank Account Statement Credit). The payment was captured and settled by Razorpay, but no corresponding UTR was found on the merchant bank statement.`;
      action = 'Escalate to acquiring nodal bank for missing NEFT/RTGS credit advice.';
    } else if (record.exceptionType === 'FEE_TAX_ANOMALY' || record.exceptionType === 'AMOUNT_MISMATCH') {
      text = `The mismatch is in the Fee / Tax calculation. Gateway deducted an unexpected MDR rate or GST variance on the net settlement.`;
      action = 'Check merchant tariff plan for MDR or surcharge revisions.';
    } else if (record.exceptionType === 'DELAYED_SETTLEMENT') {
      text = `The primary factor is the Date Window. Settlement arrived outside the expected T+0 to T+2 window.`;
      action = 'Verify whether clearing occurred across an interbank holiday.';
    } else {
      text = `Discrepancy detected in 4-factor scoring: ${record.explanation}.`;
      action = 'Verify candidate pairing in Candidate Match Explorer.';
    }
  } else if (lower.includes('approve') || lower.includes('safe')) {
    if (record.confidence >= 85) {
      text = `This record has strong evidence (Confidence: ${record.confidence}%). It meets the safety criteria for auto-resolution.`;
    } else {
      text = `Caution advised. Review the 4-factor breakdown in the Evidence Drawer before committing an approval.`;
    }
  } else if (lower.includes('exposure') || lower.includes('financial') || lower.includes('risk')) {
    text = `The financial exposure for record ${record.payment.paymentId} is ${formatINR(record.financialExposurePaise)} (${record.financialExposurePaise} paise). This represents the unverified or disputed leg amount.`;
    action = `Contain financial exposure of ${formatINR(record.financialExposurePaise)}.`;
  } else {
    text = `Grounded analysis for ${record.payment.paymentId}: ${record.explanation}. Confidence score is ${record.confidence}%. Exposure is ${formatINR(record.financialExposurePaise)}.`;
  }

  return { text, action, nextSteps };
}

export const ExceptionAssistantPanel: React.FC<ExceptionAssistantPanelProps> = ({ record }) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'initial',
      sender: 'assistant',
      text: `I am your grounded Gemini advisory copilot for record ${record.payment.paymentId}. I analyze discrepancies across the 3-way ledger without modifying financial balances or confidence scores.`,
      timestamp: 'Session start',
      source: 'ShaRecon-Advisory-Copilot',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const counterRef = useRef(1);

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    counterRef.current += 1;
    const userMsgId = `user_${counterRef.current}_${record.recordId}`;

    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record,
          userQuestion: text,
        }),
      });

      counterRef.current += 1;
      const assistantMsgId = `assistant_${counterRef.current}_${record.recordId}`;

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          text: data.summary || data.explanation || 'Analysis completed.',
          timestamp: 'Just now',
          source: data.modelUsed || 'Gemini-2.5-Flash',
          recommendedAction: data.recommendedAction,
          suggestedNextSteps: data.suggestedNextSteps,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const det = buildDeterministicResponse(record, text);
        const fallbackMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          text: det.text,
          timestamp: 'Just now',
          source: 'Deterministic Rule Engine (Offline Fallback)',
          recommendedAction: det.action,
          suggestedNextSteps: det.nextSteps,
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const det = buildDeterministicResponse(record, text);
      counterRef.current += 1;
      const fallbackMsg: Message = {
        id: `assistant_${counterRef.current}_${record.recordId}`,
        sender: 'assistant',
        text: det.text,
        timestamp: 'Just now',
        source: 'Deterministic Rule Engine (Offline Fallback)',
        recommendedAction: det.action,
        suggestedNextSteps: det.nextSteps,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="surface-card p-4 space-y-3.5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#f1efff] text-[#6d28d9] flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-mono">
              Gemini Exception Advisory Copilot
            </h4>
            <span className="text-[10px] text-slate-500 font-sans">
              Non-destructive explanatory reasoning
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'reset',
                sender: 'assistant',
                text: `Conversation reset. Ready to inspect record ${record.payment.paymentId}.`,
                timestamp: 'Just now',
                source: 'ShaRecon-Advisory-Copilot',
              },
            ]);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Reset conversation"
          aria-label="Reset chat"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Fast-Prompt Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Suggested Controller Queries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-[#f1efff] text-slate-700 hover:text-[#5b21b6] border border-slate-200 hover:border-[#ddd6fe] transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[340px] text-xs custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3.5 rounded-xl leading-relaxed ${
              m.sender === 'user'
                ? 'bg-[#635bff] text-white ml-6 font-medium shadow-xs'
                : 'surface-inset text-slate-800 mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] opacity-80 mb-1 font-mono">
              <span>{m.sender === 'user' ? 'Finance Controller' : m.source || 'ShaRecon AI'}</span>
              <span>{m.timestamp}</span>
            </div>
            <p className="whitespace-pre-wrap font-sans">{m.text}</p>

            {m.recommendedAction && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-[#4c1d95] bg-[#f1efff] p-2.5 rounded-lg font-semibold font-sans">
                Remediation Action: {m.recommendedAction}
              </div>
            )}

            {m.suggestedNextSteps && m.suggestedNextSteps.length > 0 && (
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                <span className="font-bold uppercase tracking-wider text-slate-700">Next Steps:</span>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5 font-sans">
                  {m.suggestedNextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="p-3 bg-[#f1efff] border border-[#ddd6fe] rounded-xl text-[#6d28d9] text-xs flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Generating grounded remediation advice from 3-way trace...</span>
          </div>
        )}
      </div>

      {/* Input Query Bar */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder={`Ask about ${record.payment.paymentId}...`}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={isLoading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#635bff] focus:bg-white transition-colors"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#5b21b6] text-white transition-colors disabled:opacity-40 cursor-pointer shadow-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Safety Disclosure Banner */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#098f74] shrink-0 mt-0.5" />
        <span className="font-sans">
          <strong>Grounded Advisory Guarantee:</strong> Gemini advisory answers are informational only. They do not alter financial balances, transaction IDs, or the deterministic 4-factor scoring matrix.
        </span>
      </div>
    </div>
  );
};

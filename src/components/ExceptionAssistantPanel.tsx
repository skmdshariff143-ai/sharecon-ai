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
      action = 'Cross-verify raw statement feeds in Evidence Drawer.';
    }
  } else if (lower.includes('safe') || lower.includes('approve')) {
    if (record.confidence >= 85) {
      text = `This record has high confidence (${record.confidence}%) and meets zero-touch auto-reconciliation thresholds.`;
      action = 'Safe to approve if verified against merchant order database.';
    } else if (record.exceptionType === 'MISSING_BANK_CREDIT') {
      text = `CAUTION: Do not approve without bank credit confirmation. Financial exposure is ${formatINR(record.financialExposurePaise)}.`;
      action = 'Hold in review queue until bank credit is located or nodal debit advice is issued.';
    } else {
      text = `Manual review is required. Confidence score is ${record.confidence}%.`;
      action = 'Verify supporting documents before approving.';
    }
  } else if (lower.includes('exposure') || lower.includes('financial') || lower.includes('amount')) {
    text = `Potential financial exposure for this exception is ${formatINR(record.financialExposurePaise)}. Gross payment: ${formatINR(record.payment.grossAmount)}, Expected Net: ${formatINR(record.payment.expectedNetAmount)}.`;
    action = 'Verify ledger balance against nodal escrow statement.';
  } else {
    text = `Summary for ${record.payment.paymentId}: Exception classified as ${record.exceptionType.replace(/_/g, ' ')} with score ${record.confidence}%. ${record.explanation}`;
    action = 'Follow standard operating procedure for this anomaly class.';
  }

  return { text, action, nextSteps };
}

export const ExceptionAssistantPanel: React.FC<ExceptionAssistantPanelProps> = ({ record }) => {
  const msgCounterRef = useRef(0);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello, I am your grounded exception copilot for record ${record.payment.paymentId}. Ask any question about why this record failed 3-way reconciliation or select a preset prompt below.`,
      timestamp: 'Just now',
      source: 'Deterministic Grounded Engine',
      recommendedAction: 'Inspect candidate legs and 4-factor breakdown.',
      suggestedNextSteps: ['Check settlement UTR', 'Review date proximity SLA'],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    msgCounterRef.current += 1;
    const currentId = msgCounterRef.current;

    const userMsg: Message = {
      id: `user_${currentId}`,
      sender: 'user',
      text: queryText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Simulate grounded response generation (250ms)
    setTimeout(() => {
      msgCounterRef.current += 1;
      const assistantId = msgCounterRef.current;
      const response = buildDeterministicResponse(record, queryText);
      const assistantMsg: Message = {
        id: `assistant_${assistantId}`,
        sender: 'assistant',
        text: response.text,
        timestamp: 'Just now',
        source: 'Grounded Financial Rules',
        recommendedAction: response.action,
        suggestedNextSteps: response.nextSteps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 250);
  };

  const handleResetChat = () => {
    msgCounterRef.current += 1;
    setMessages([
      {
        id: `welcome_${msgCounterRef.current}`,
        sender: 'assistant',
        text: `Session reset for ${record.payment.paymentId}. How can I assist with this transaction exception?`,
        timestamp: 'Just now',
        source: 'Deterministic Grounded Engine',
      },
    ]);
  };

  return (
    <div className="elevated-card p-4 sm:p-5 flex flex-col h-[500px] bg-[#0e131f] border-white/8 space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#c084fc]/15 text-[#c084fc] flex items-center justify-center border border-[#c084fc]/25">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#f8fafc] font-mono flex items-center gap-1.5">
              <span>Exception Copilot</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#c084fc]/15 text-[#e9d5ff] font-sans border border-[#c084fc]/25">
                Grounded
              </span>
            </h3>
            <p className="text-[10px] text-[#64748b] font-mono">
              Target: {record.payment.paymentId}
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Reset Copilot Conversation"
          aria-label="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(q)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#080c14] hover:bg-[#141b2b] text-[#94a3b8] hover:text-white rounded-lg text-[11px] font-medium border border-white/8 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col text-xs font-sans ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 space-y-1.5 ${
                msg.sender === 'user'
                  ? 'bg-[#6366f1] text-white rounded-br-none shadow-xs'
                  : 'bg-[#141b2b] text-[#f8fafc] border border-white/8 rounded-bl-none shadow-xs'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>

              {msg.recommendedAction && (
                <div className="pt-1.5 border-t border-white/10 text-[11px]">
                  <strong className="text-[#a5b4fc]">Recommended Action:</strong>
                  <p className="text-[#94a3b8] mt-0.5">{msg.recommendedAction}</p>
                </div>
              )}

              {msg.suggestedNextSteps && msg.suggestedNextSteps.length > 0 && (
                <div className="pt-1 border-t border-white/10 text-[11px]">
                  <strong className="text-[#64748b]">Suggested Checks:</strong>
                  <ul className="list-disc list-inside text-[#94a3b8] mt-0.5 space-y-0.5">
                    {msg.suggestedNextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <span className="text-[10px] text-[#64748b] mt-1 font-mono px-1">
              {msg.timestamp} {msg.source && `• ${msg.source}`}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] p-2 bg-[#080c14] rounded-lg border border-white/8 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c084fc]" />
            <span>Formulating grounded diagnosis...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery(inputQuery);
        }}
        className="flex items-center gap-2 pt-2 border-t border-white/8 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask why this transaction failed, check exposure, or verify safety..."
          className="flex-1 px-3 py-2 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shadow-xs"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Safety Notice */}
      <div className="text-[10px] text-[#64748b] flex items-center justify-between pt-1 border-t border-white/8 font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#2dd4bf]" />
          Advisory Copilot Only — Cannot Mutate Financial Ledgers
        </span>
      </div>
    </div>
  );
};

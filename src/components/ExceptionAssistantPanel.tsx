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

    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record,
          customPrompt: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        counterRef.current += 1;
        const assistantMsgId = `ai_${counterRef.current}_${record.recordId}`;

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: data.analysis.summary,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: data.source === 'GEMINI_2_5_FLASH' ? 'Gemini 2.5 Flash' : 'Deterministic Advisory Fallback',
            recommendedAction: data.analysis.recommendedAction,
            suggestedNextSteps: data.analysis.suggestedNextSteps,
          },
        ]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Deterministic Offline Fallback
      const fallback = buildDeterministicResponse(record, text);
      counterRef.current += 1;
      const fallbackMsgId = `fb_${counterRef.current}_${record.recordId}`;

      setMessages((prev) => [
        ...prev,
        {
          id: fallbackMsgId,
          sender: 'assistant',
          text: fallback.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'Deterministic Advisory Fallback (Offline)',
          recommendedAction: fallback.action,
          suggestedNextSteps: fallback.nextSteps,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    counterRef.current += 1;
    setMessages([
      {
        id: `reset_${counterRef.current}`,
        sender: 'assistant',
        text: `Chat reset for record ${record.payment.paymentId}. Ask any question regarding ledger evidence, fee tolerances, or settlement delays.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'ShaRecon-Advisory-Copilot',
      },
    ]);
  };

  return (
    <div className="flex flex-col space-y-3.5 bg-[#111620] border border-white/10 rounded-2xl p-4.5 shadow-2xl">
      {/* Header with Grounded Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#a78bfa]/20 text-[#a78bfa] flex items-center justify-center border border-[#a78bfa]/40 shadow-[0_0_8px_rgba(167,139,250,0.4)]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#f7f8fc] flex items-center gap-1.5 font-mono">
              <span>Gemini Advisory Copilot</span>
              <span className="text-[10px] font-bold uppercase bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/35 px-1.5 py-0.2 rounded font-mono">
                Advisory Only
              </span>
            </div>
            <div className="text-[10px] text-[#7d879b]">
              Grounded on 3-way ledger context for <strong className="text-[#f7f8fc] font-mono">{record.payment.paymentId}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 rounded-lg text-[#7d879b] hover:text-[#a7afc0] hover:bg-white/5 transition-colors cursor-pointer"
          title="Reset conversation"
          aria-label="Reset chat"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Fast-Prompt Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#7d879b] uppercase tracking-wider font-mono">
          Suggested Controller Queries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1.5 rounded-xl bg-[#0c101a] hover:bg-[#a78bfa]/15 text-[#a7afc0] hover:text-[#c4b5fd] border border-white/10 hover:border-[#a78bfa]/35 transition-colors text-left cursor-pointer disabled:opacity-50 font-sans"
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
                ? 'bg-[#7168ff] text-white ml-6 font-medium shadow-xs'
                : 'bg-[#0c101a] border border-white/10 text-[#f7f8fc] mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] opacity-80 mb-1 font-mono text-[#a7afc0]">
              <span>{m.sender === 'user' ? 'Finance Controller' : m.source || 'ShaRecon AI'}</span>
              <span>{m.timestamp}</span>
            </div>
            <p className="whitespace-pre-wrap font-sans">{m.text}</p>

            {m.recommendedAction && (
              <div className="mt-2 pt-2 border-t border-[#a78bfa]/20 text-[11px] text-[#c4b5fd] bg-[#a78bfa]/15 p-2.5 rounded-xl font-semibold font-sans">
                Remediation Action: {m.recommendedAction}
              </div>
            )}

            {m.suggestedNextSteps && m.suggestedNextSteps.length > 0 && (
              <div className="mt-2 text-[10px] text-[#7d879b] font-mono">
                <span className="font-bold uppercase tracking-wider text-[#a7afc0]">Next Steps:</span>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5 font-sans text-[#a7afc0]">
                  {m.suggestedNextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="p-3 bg-[#a78bfa]/15 border border-[#a78bfa]/30 rounded-xl text-[#c4b5fd] text-xs flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a78bfa]" />
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
          className="flex-1 bg-[#0c101a] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f7f8fc] placeholder:text-[#7d879b] focus:outline-hidden focus:ring-1 focus:ring-[#7168ff] transition-colors"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#a78bfa] hover:bg-[#8b5cf6] text-[#070a10] font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Safety Disclosure Banner */}
      <div className="p-2.5 bg-[#0c101a] border border-white/10 rounded-xl text-[10px] text-[#7d879b] flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0 mt-0.5" />
        <span className="font-sans">
          <strong>Grounded Advisory Guarantee:</strong> Gemini advisory answers are informational only. They do not alter financial balances, transaction IDs, or the deterministic 4-factor scoring matrix.
        </span>
      </div>
    </div>
  );
};

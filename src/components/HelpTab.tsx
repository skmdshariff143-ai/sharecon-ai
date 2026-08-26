import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  Scale,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { WorkspaceTab } from '@/types/reconciliation';

interface HelpTabProps {
  onNavigateTab: (tab: WorkspaceTab) => void;
  onStartTour: () => void;
}

interface FAQItem {
  id: string;
  category: 'Concepts' | 'Scoring' | 'Safety' | 'Metrics' | 'AI';
  question: string;
  answer: string;
  targetTab?: WorkspaceTab;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: 'what-is-3way',
    category: 'Concepts',
    question: 'What is 3-way financial reconciliation in Razorpay?',
    answer:
      '3-way reconciliation verifies three financial legs: (1) Captured customer orders in the merchant ledger, (2) Nodal gateway settlement batches with 2.0%-3.5% fee + 18% GST deductions, and (3) Actual credit entries on the merchant bank account statement matching via bank UTR.',
    targetTab: 'control_center',
  },
  {
    id: 'why-amounts-differ',
    category: 'Concepts',
    question: 'Why do settled amounts differ from payment gross amounts?',
    answer:
      'Payment gateways deduct Merchant Discount Rate (MDR) fees (typically 2.0% for standard cards up to 3.5% for corporate cards) plus 18% GST on the fee portion. For example, a ₹5,000 transaction with 2% MDR has ₹100 fee + ₹18 GST = ₹118 total fee, settling exactly ₹4,882.00 (488,200 paise).',
    targetTab: 'reconciliation',
  },
  {
    id: 'how-scoring-works',
    category: 'Scoring',
    question: 'How does the 4-factor scoring engine work?',
    answer:
      'Every candidate match is evaluated across 4 deterministic factors totaling 100 points: Reference Match (40 pts), Amount Compatibility (35 pts: 20 for expected net + 15 for bank credit), Date Proximity (15 pts for T+0 to T+3), and UTR / Description Overlap (10 pts).',
    targetTab: 'methodology',
  },
  {
    id: 'auto-vs-review',
    category: 'Scoring',
    question: 'What separates Auto-Reconciled matches from Human Review cases?',
    answer:
      'Records with confidence score >= 85% AND clean matching type are safely auto-reconciled. Any record with score 50%-84% OR an anomaly (such as date skew, fee rate variance, or ambiguous amount) is routed to the human reviewer queue with 100% explainability.',
    targetTab: 'reconciliation',
  },
  {
    id: 'financial-exposure',
    category: 'Safety',
    question: 'How is Financial Exposure calculated?',
    answer:
      'Financial exposure measures the exact rupee value at risk for unresolved or missing legs. For missing bank credits, exposure is the full net settled amount. For fee discrepancies, exposure is the delta between expected and actual fee deductions.',
    targetTab: 'exceptions',
  },
  {
    id: 'immutable-baseline',
    category: 'Safety',
    question: 'Are baseline benchmark metrics immutable when human reviewers act?',
    answer:
      'Yes. When a finance controller Approves, Rejects, or Flags a transaction, operational counters update live, but the baseline algorithmic ground-truth benchmark remains strictly immutable. This prevents human actions from masking engine classification defects.',
    targetTab: 'evaluation',
  },
  {
    id: 'gemini-boundary',
    category: 'AI',
    question: 'What is the exact boundary of Gemini AI in ShaRecon AI?',
    answer:
      'Gemini operates strictly as an advisory copilot. It generates natural language summaries, suggests actionable remediation steps, and flags missing checklist items. Gemini AI CANNOT alter confidence scores, override deterministic safety gates, or execute fund transfers.',
    targetTab: 'exceptions',
  },
];

export const HelpTab: React.FC<HelpTabProps> = ({ onNavigateTab, onStartTour }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('what-is-3way');

  const filteredFaqs = useMemo(() => {
    return FAQ_DATABASE.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="elevated-card p-6 sm:p-7 bg-[#0e131f] border-white/8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-[#818cf8] text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Judge Guide, System Architecture &amp; FAQs</span>
          </div>
          <h2 className="text-xl font-bold text-[#f8fafc] font-mono">
            How ShaRecon AI Works
          </h2>
          <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
            Comprehensive guide to the 3-way reconciliation lifecycle, deterministic 4-factor scoring graph, integer-paise arithmetic, and AI advisory boundaries.
          </p>
        </div>

        <button
          onClick={onStartTour}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.35)] min-h-[40px]"
        >
          <BookOpen className="w-4 h-4" />
          <span>Launch Guided Walkthrough</span>
        </button>
      </div>

      {/* Architecture Visual Guide */}
      <div className="elevated-card p-6 space-y-5 bg-[#0e131f] border-white/8 shadow-xl">
        <div className="border-b border-white/8 pb-3">
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-[#818cf8]" />
            <span>The 3-Way Reconciliation Lifecycle</span>
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
            How transaction data flows from customer checkout to merchant nodal bank credit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#080c14] border border-[#6366f1]/25 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-[#818cf8]">
              <span>Leg 1: Merchant Ledger</span>
              <span className="text-[10px] bg-[#6366f1]/15 text-[#a5b4fc] px-1.5 py-0.5 rounded">
                Order Ingest
              </span>
            </div>
            <p className="text-[#94a3b8] leading-relaxed font-sans">
              Customer checkouts captured on Razorpay gateway with Gross Amount, Order ID, and Payment ID.
            </p>
          </div>

          <div className="p-4 bg-[#080c14] border border-[#fbbf24]/25 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-[#fbbf24]">
              <span>Leg 2: Nodal Settlement</span>
              <span className="text-[10px] bg-[#fbbf24]/15 text-[#fbbf24] px-1.5 py-0.5 rounded">
                MDR &amp; GST
              </span>
            </div>
            <p className="text-[#94a3b8] leading-relaxed font-sans">
              Gateway settlement batch advice deducting Merchant Discount Rate (2.0%-3.5%) + 18% GST to calculate Expected Net.
            </p>
          </div>

          <div className="p-4 bg-[#080c14] border border-[#2dd4bf]/25 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-[#2dd4bf]">
              <span>Leg 3: Bank Account</span>
              <span className="text-[10px] bg-[#2dd4bf]/15 text-[#2dd4bf] px-1.5 py-0.5 rounded">
                Bank UTR
              </span>
            </div>
            <p className="text-[#94a3b8] leading-relaxed font-sans">
              Actual credited entry in merchant bank nodal account confirmed via UTR and narration timestamp.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Factor Scoring Guide */}
      <div className="elevated-card p-6 space-y-4 bg-[#0e131f] border-white/8 shadow-xl">
        <div className="border-b border-white/8 pb-3">
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
            <Scale className="w-4 h-4 text-[#2dd4bf]" />
            <span>Deterministic 4-Factor Confidence Scoring</span>
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
            Mathematical model allocating 100 confidence points with zero LLM hallucination in the critical path.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[#080c14] border border-white/8 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-mono font-bold text-[#818cf8]">
              <span>1. Reference Key</span>
              <span className="text-xs">40 pts</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-sans">
              Direct payment ID match (40 pts) or Order reference fallback (30 pts).
            </p>
          </div>

          <div className="p-3.5 bg-[#080c14] border border-white/8 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-mono font-bold text-[#2dd4bf]">
              <span>2. Amount Match</span>
              <span className="text-xs">35 pts</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-sans">
              Net settlement compatibility (20 pts) + bank credit compatibility (15 pts).
            </p>
          </div>

          <div className="p-3.5 bg-[#080c14] border border-white/8 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-mono font-bold text-[#fbbf24]">
              <span>3. Date Proximity</span>
              <span className="text-xs">15 pts</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-sans">
              T+0 to T+2 SLA (15 pts), decaying to 0 beyond T+4 window.
            </p>
          </div>

          <div className="p-3.5 bg-[#080c14] border border-white/8 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-mono font-bold text-[#c084fc]">
              <span>4. UTR Narration</span>
              <span className="text-xs">10 pts</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-sans">
              Exact UTR equality (10 pts) or fuzzy description similarity (5 pts).
            </p>
          </div>
        </div>
      </div>

      {/* Searchable FAQ Database */}
      <div className="elevated-card p-6 space-y-4 bg-[#0e131f] border-white/8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-[#818cf8]" />
              <span>Frequently Asked Questions &amp; Glossary</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-sans">
              Find answers on scoring thresholds, safety boundaries, and financial metrics.
            </p>
          </div>

          {/* FAQ Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts, MDR, thresholds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#080c14] border border-white/8 rounded-xl text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'Concepts', 'Scoring', 'Safety', 'Metrics', 'AI'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/35 font-bold'
                  : 'bg-[#080c14] text-[#94a3b8] hover:text-white border border-white/8'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748b] font-sans">
              No FAQs matched your search query.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;

              return (
                <div
                  key={faq.id}
                  className="p-4 bg-[#080c14] border border-white/8 rounded-xl transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    className="w-full flex items-center justify-between text-left gap-3 cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <span className="text-xs font-bold text-[#f8fafc] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>
                      {faq.question}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#64748b] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#64748b] shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pt-3 mt-2 border-t border-white/8 text-xs text-[#94a3b8] leading-relaxed font-sans space-y-2">
                      <p>{faq.answer}</p>
                      {faq.targetTab && (
                        <button
                          onClick={() => onNavigateTab(faq.targetTab!)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#818cf8] hover:text-[#a5b4fc] transition-colors cursor-pointer"
                        >
                          <span>Explore in {faq.targetTab.replace(/_/g, ' ')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

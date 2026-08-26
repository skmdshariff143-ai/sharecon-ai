import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceTab } from './NavigationRail';

interface TourStep {
  title: string;
  tab: WorkspaceTab;
  badge: string;
  content: string;
  targetExplanation: string;
}

interface GuidedDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Executive Control Center & 3-Way Funnel',
    tab: 'control_center',
    badge: 'Architecture & Volume',
    content:
      'ShaRecon AI reconciles multi-leg payments across Razorpay Orders, Gateway Settlements, and Merchant Bank Statements. The 3-way funnel shows where drop-offs occur across 180 synthetic records.',
    targetExplanation:
      'All financial calculations operate in integer paise to eliminate floating-point representation drift.',
  },
  {
    title: '2. 3-Way Reconciliation Workspace',
    tab: 'reconciliation',
    badge: 'Data Grid & Filters',
    content:
      'Search across Payment IDs, Order refs, and Bank UTRs. Status badges separate safe auto-reconciled matches from cases requiring human controller approval.',
    targetExplanation:
      'Multi-facet filter toolbar allows finance teams to isolate fee tier discrepancies, date cutoffs, and missing advice lines.',
  },
  {
    title: '3. Evidence Inspector & 3-Way Trace',
    tab: 'reconciliation',
    badge: 'Explainability & Lineage',
    content:
      'Clicking any record opens the slide-out Evidence Drawer, displaying the complete 3-way lineage: Payment Ledger ➔ Nodal Settlement ➔ Bank Statement Credit.',
    targetExplanation:
      '4-factor scoring (Reference: 40, Amount: 35, Date: 15, Desc: 10) produces plain-English traceable explanations for 100% of decisions.',
  },
  {
    title: '4. Exception Triage & Severity Ranking',
    tab: 'exceptions',
    badge: 'Risk Prioritization',
    content:
      'The Exception Command Center prioritizes unresolved discrepancies by monetary exposure, separating Critical missing bank credits from Minor fee rate variances.',
    targetExplanation:
      'Filters by exception category enable rapid bulk diagnosis of fee anomalies, delayed settlements, and ambiguous amounts.',
  },
  {
    title: '5. Grounded Gemini AI Advisory Copilot',
    tab: 'exceptions',
    badge: 'Safe AI Boundaries',
    content:
      'Gemini AI assists finance reviewers by formulating structured diagnoses, actionable next steps, and missing document checklists. AI is bounded: it cannot modify scores or commit matches.',
    targetExplanation:
      'If the live Gemini API is unreachable, deterministic offline fallback analysis ensures seamless operation.',
  },
  {
    title: '6. Forensic Append-Only Audit Trail',
    tab: 'audit',
    badge: 'Governance & Compliance',
    content:
      'Every auto-reconciliation, manual approval, rejection, and policy change is permanently logged with SHA-256 integrity during the session and exportable to CSV/JSON.',
    targetExplanation:
      'Complete traceability guarantees readiness for statutory financial audits.',
  },
  {
    title: '7. Honest Evaluation Lab & Policy Matrix',
    tab: 'evaluation',
    badge: 'Benchmark & Simulator',
    content:
      'Inspect honest, separated precision metrics across 5 random seeds, simulate policy threshold tradeoffs, and test the 80-case held-out adversarial benchmark.',
    targetExplanation:
      'Live policy simulator lets controllers model the impact of changing confidence thresholds before saving.',
  },
];

export const GuidedDemoTour: React.FC<GuidedDemoTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onNavigateTab(TOUR_STEPS[next].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onNavigateTab(TOUR_STEPS[prev].tab);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a10]/85 backdrop-blur-md animate-fade-in"
    >
      <div className="modal-surface max-w-lg w-full p-6 shadow-2xl bg-[#141b2b] border border-white/12 rounded-2xl animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 text-[#818cf8] flex items-center justify-center border border-[#6366f1]/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#818cf8] font-bold uppercase tracking-wider block">
                Guided Interactive Walkthrough
              </span>
              <span className="text-xs font-semibold text-[#94a3b8]">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2">
            <h3 id="tour-step-title" className="text-base font-bold text-[#f8fafc] font-mono">
              {step.title}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/30">
              {step.badge}
            </span>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
            {step.content}
          </p>

          <div className="p-3 bg-[#080c14] rounded-xl border border-white/8 text-[11px] text-[#2dd4bf] font-sans">
            <strong className="block font-mono text-[10px] uppercase text-[#64748b] mb-0.5">
              Key Engineering Highlight:
            </strong>
            {step.targetExplanation}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStep(idx);
                onNavigateTab(TOUR_STEPS[idx].tab);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep ? 'w-6 bg-[#6366f1]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to tour step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8">
          <button
            onClick={onClose}
            className="text-xs text-[#64748b] hover:text-white transition-colors cursor-pointer font-sans"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 bg-[#080c14] hover:bg-[#1a2236] text-[#94a3b8] hover:text-white rounded-xl text-xs font-semibold border border-white/8 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] hover:from-[#4f46e5] hover:to-[#2563eb] text-white rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

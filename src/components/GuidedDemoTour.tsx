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
    title: '5. Grounded Gemini Analyst & Fallback',
    tab: 'exceptions',
    badge: 'Advisory AI Copilot',
    content:
      'Gemini 2.5 Flash analyzes transaction anomalies to generate remediation checklists. When API keys are absent or rate limits are reached, the deterministic offline fallback activates with explicit UI disclosure.',
    targetExplanation:
      'AI operates strictly as an advisory copilot—it cannot move funds, modify confidence scores, or alter IDs.',
  },
  {
    title: '6. Reviewer Workflow & Confirmation Safeguards',
    tab: 'reconciliation',
    badge: 'Human-in-the-Loop',
    content:
      'Finance controllers can Approve, Reject, or Flag review cases. To prevent accidental commitments, consequential actions require explicit confirmation and record auditor notes.',
    targetExplanation:
      'Reviewer approvals update live operational state without modifying the baseline algorithmic benchmark.',
  },
  {
    title: '7. Immutable Audit Trail & Compliance Export',
    tab: 'audit',
    badge: 'Audit & Governance',
    content:
      'Every automated scoring decision and human controller action is recorded in an append-only event log with previous/new state diffs and timestamps.',
    targetExplanation:
      'Audit logs can be exported directly to JSON and CSV formats for external compliance inspections.',
  },
  {
    title: '8. Evaluation Lab & Live Threshold Simulator',
    tab: 'evaluation',
    badge: 'Honest Metrics',
    content:
      'Evaluates engine decisions against ground truth using separated metrics (Proposed-Pair Precision, Auto-Precision, Review-Routing). Test multi-seed robustness across 5 seeds or simulate threshold trade-offs in real time.',
    targetExplanation:
      'Zero fabricated metrics. The Error Inspector table displays every single mismatch for transparent review.',
  },
];

export const GuidedDemoTour: React.FC<GuidedDemoTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleRestart = React.useCallback(() => {
    setCurrentStep(0);
    onNavigateTab(TOUR_STEPS[0].tab);
  }, [onNavigateTab]);

  const handleNext = React.useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      onNavigateTab(TOUR_STEPS[nextIdx].tab);
    } else {
      onClose();
    }
  }, [currentStep, onNavigateTab, onClose]);

  const handlePrev = React.useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      onNavigateTab(TOUR_STEPS[prevIdx].tab);
    }
  }, [currentStep, onNavigateTab]);

  // Keyboard navigation handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed bottom-6 left-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[#0c1220] text-white border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"></div>

        {/* Step Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-900/80 text-violet-300 border border-violet-700/60 px-2 py-0.5 rounded-full font-mono">
              {step.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg cursor-pointer hover:bg-slate-800/60"
            aria-label="Close guided demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Body */}
        <div>
          <h4 className="text-sm font-extrabold text-white leading-tight font-mono">
            {step.title}
          </h4>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
            {step.content}
          </p>
        </div>

        {/* Highlight Callout */}
        <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50 flex items-start gap-2 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span className="leading-snug">{step.targetExplanation}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {currentStep > 0 && (
              <button
                onClick={handleRestart}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Restart walkthrough from beginning"
              >
                Restart
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'bg-indigo-400 w-3' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer min-h-[34px]"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

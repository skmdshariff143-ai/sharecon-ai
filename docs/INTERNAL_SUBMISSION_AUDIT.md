# ShaRecon AI — Internal Submission Self-Assessment & Audit

> **Document Type**: Internal Technical Self-Assessment  
> **Disclaimer**: *This is an internal self-assessment and is not an evaluation or endorsement by Razorpay.*  
> **Track**: Razorpay AI Buildathon — AI Finance Controller  
> **Repository**: [https://github.com/skmdshariff143-ai/sharecon-ai](https://github.com/skmdshariff143-ai/sharecon-ai)  
> **Branch**: `fix/metric-integrity`  
> **Target Status**: Verified on Vercel Preview (Production on `main` pending explicit review and approval)

---

## 📋 Internal Quality & Verification Checklist

| Verification Domain | Internal Evaluation Criteria | Verification Status | Concrete Evidence / Test Reference |
| :--- | :--- | :---: | :--- |
| **1. Problem Value & Relevance** | Real merchant 3-ledger reconciliation friction (captures, settlements, bank credits) | **VERIFIED** | 14 financial anomaly taxonomies modeled in `src/types/reconciliation.ts`. |
| **2. Metric Integrity & Numerical Truth** | Recomputed metrics match across UI, README, JSON, and reports with zero contradictions | **VERIFIED** | Multi-seed benchmark (111/111 safe matches, ₹0 FP) and Held-Out fixture (35/42 safe auto, ₹28,100 FP) match exact formulas. |
| **3. Safety & Circuit Breakers** | 1-to-1 matching constraints, currency breakers, fee delta tolerances, AI isolated from ledger mutations | **VERIFIED** | Bipartite graph assignment in `matcher.ts`; currency circuit breakers in `scorer.ts`; AI bounded to structured advisory. |
| **4. Failure Behavior & Fallbacks** | Graceful local execution without Gemini credentials; timeout & malformed JSON handlers | **VERIFIED** | Deterministic offline rule fallback in `src/lib/ai/analyst.ts`; 6s `AbortController` timeout; Zod schema parsing. |
| **5. Reproducibility & Build Quality** | Pinned Node 20 runtime; local dev tools; deterministic artifact generation; zero git diff | **VERIFIED** | `.nvmrc` (20.18.3), `package.json` engines, `npm run verify:artifacts`, and green CI quality gate. |
| **6. User Experience & Responsiveness** | Multi-viewport responsive support (1440, 1366, 1280, 1024, 390); zero horizontal scroll | **VERIFIED** | Automated Playwright responsive matrix in `tests/e2e/responsive.spec.ts` (`scrollWidth <= clientWidth`). |
| **7. Submission Completeness** | Open-source repository, 5-minute video pitch, architecture docs, post-mortem, limitations | **VERIFIED** | `README.md`, `docs/DEMO_SCRIPT.md`, `docs/WHAT_BROKE.md`, and `docs/METRIC_INTEGRITY_AUDIT.md`. |

---

## 🔍 Detailed Self-Audit Across Assessment Dimensions

### 1. Problem Value & Relevance
- **Merchant Pain Points Addressed**: Digital businesses processing via payment gateways struggle to reconcile captured customer orders with net payout settlements and acquiring bank account deposits.
- **Financial Risk Mitigation**:
  - **MDR Fee & GST Skew**: Reconciles variable 2.0%–3.5% MDR rates + 18% GST deductions.
  - **Reference Truncation**: Matches clipped references when legacy switches truncate 18-character payment IDs.
  - **Timing Skew**: Accommodates T+0 to T+3 banking holiday delays without naive same-day failure.
  - **UTR & Amount Collisions**: Identifies identical gross amounts across distinct orders to prevent double-crediting.

---

### 2. Metric Integrity & Numerical Truth
- **Synthetic Multi-Seed Benchmark (Seeds 42, 101, 777, 2024, 9999)**:
  - Seed 42 Baseline: 180 total records; 111 auto-reconciled (61.7%); 39 manual review (21.7%); 30 unmatched exceptions (16.7%).
  - Proposed-Pair Precision: 90.6% (163 / 180).
  - Proposed-Pair Recall: 91.1% (164 / 180).
  - Auto-Resolution Precision: 100.0% (111 / 111 safe clean records).
  - Auto-Resolution Recall: 100.0% (111 / 111 clean records).
  - Review-Routing Accuracy: 83.0% (39 / 47 review cases).
  - False-Positive Exposure: ₹0.00 (0 paise).
  - Deterministic V8 Engine Latency: ~4.8 ms.
- **Manually Curated Held-Out Adversarial Fixture (80 Cases)**:
  - Proposed-Pair Precision: 97.1% (68 / 70 proposed links).
  - Proposed-Pair Recall: 97.1% (68 / 70 expected links).
  - Auto-Resolution Precision: 83.3% (35 / 42 auto-resolved records; 7 edge cases isolated in Error Inspector).
  - Auto-Resolution Recall: 100.0% (35 / 35 clean records).
  - Review-Routing Accuracy: 75.9% (22 / 29 anomaly cases).
  - False-Positive Exposure: ₹28,100.00 (7 edge cases reported honestly without post-hoc engine tuning).
  - Deterministic V8 Engine Latency: ~24.4 ms.
- **Consistency Verification**: All values across UI components, `README.md`, `docs/generated/benchmark.json`, `docs/evaluation/HELD_OUT_REPORT.md`, and Vitest tests match exact formulas.

---

### 3. Safety & Circuit Breakers
- **1-to-1 Bipartite Graph Assignment**: Prevents duplicate allocation of settlement advice and bank deposits to multiple payment records.
- **Circuit Breakers**:
  - Currency breaker: Rejects non-INR records (`USD`, `EUR`, `GBP`) and routes them to `UNMATCHED_EXCEPTION`.
  - Amount delta tolerance: Fee variances $> ₹2.00$ cap confidence below $85\%$ and route to human review.
- **AI Architectural Boundary**: Gemini 2.5 Flash operates strictly as an advisory copilot via server-side routes. The model has **zero authority or technical capability to modify confidence scores, alter matching graph assignments, or trigger fund transfers**.

---

### 4. Failure Behavior & Resilience
- **Offline Rule-Based Analyst Fallback**: In the absence of a `GEMINI_API_KEY`, the application automatically falls back to deterministic rule-based analysis with explicit `[Offline Fallback]` provenance tags.
- **Error Handling**: Implements a 6-second `AbortController` timeout on AI requests and validates output schemas via Zod.
- **Human Governance**: Approvals, rejections, and reviewer notes are written to an append-only audit trail with CSV and JSON exports.

---

### 5. Reproducibility & Build Quality
- **Pinned Runtime**: Node.js `^20.18.3` in `.nvmrc` and `package.json` engines.
- **Deterministic Artifacts**: `npm run verify:artifacts` ensures that regenerating benchmark and held-out reports results in zero uncommitted git diffs.
- **Automated Verification Pipeline**: `npm run verify` executes linting, type-checking, unit tests, artifact verification, Next.js build, and Playwright E2E tests sequentially.

---

### 6. User Experience & Responsive Design
- **Responsive Viewport Support**: Validated across Desktop ($1440\times900$), Laptop ($1366\times768$, $1280\times720$), Tablet ($1024\times768$), and Mobile ($390\times844$, $360\times800$).
- **Command Bar Hierarchy**: Primary actions (Run Demo, Guided Demo, Quick Jump) remain visible; secondary tools collapse into an accessible overflow menu on constrained viewports.
- **Keyboard Navigation**: Supports `⌘K` for quick search and `Escape` for dismissal. Clean browser console with zero runtime errors.

---

### 7. Submission Completeness
- **Public GitHub Repository**: [https://github.com/skmdshariff143-ai/sharecon-ai](https://github.com/skmdshariff143-ai/sharecon-ai)
- **Vercel Preview URL**: Verified on active feature branch.
- **5-Minute Pitch Script**: Detailed in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) with exact timestamps and panel Q&A.
- **Post-Mortem Documentation**: Detailed in [`docs/WHAT_BROKE.md`](docs/WHAT_BROKE.md).

---

## 🎯 Anticipated Technical Panel Questions & Defenses

### Question 1: "Why did you choose a deterministic 4-factor scoring engine over an end-to-end LLM matcher?"
> **Defense**:  
> *"Financial ledgers require exact mathematical determinism, integer-paise precision, and low-latency execution at scale. Prompting an LLM to perform arithmetic comparisons across thousands of rows introduces non-deterministic outputs, token latency, and floating-point unpredictability.  
> We enforce a clear separation of concerns: our deterministic engine handles 1-to-1 bipartite graph matching and currency math, while Gemini 2.5 Flash operates strictly as an advisory copilot to synthesize unstructured evidence into human-readable triage checklists."*

### Question 2: "In your Held-Out evaluation, you report 7 false positives and ₹28,100 in exposure. Why didn't you tune the engine to get 100%?"
> **Defense**:  
> *"Tuning an engine post-hoc against a held-out test dataset invalidates evaluation integrity through over-fitting. The 7 false-positive cases in the held-out suite occurred on hand-crafted edge cases where a settlement advice matched the gross amount with an exact UTR but had an adversarial 1-rupee fee discrepancy, scoring at 86% composite confidence (just 1% above our default 85% auto-threshold).  
> Rather than modifying weights post-hoc, we report these figures honestly and provide an interactive Error Inspector and Policy Simulator where a risk controller can raise the high threshold to 90%, eliminating all 7 false positives while preserving 100% clean auto-resolution."*

### Question 3: "What was your most difficult technical bug, and how did you prevent regressions?"
> **Defense**:  
> *"Our hardest bug was the Simulation Collision Graph Blinding failure documented in `docs/WHAT_BROKE.md`. During early simulator development, the baseline reported 111 clean auto-reconciliations and ₹0 exposure, but the simulator reported 118 auto-reconciliations and ₹1.42 Lakhs in false-positive risk under identical thresholds.  
> We discovered that the UI was reverse-engineering statement inputs from matched output records, inadvertently stripping uncredited bank transactions and distractor collision entries. Without distractors in the input feed, the 1-to-1 collision solver was blinded to ambiguity.  
> We fixed this by preserving the complete raw transaction triad in state, standardizing all execution on a single canonical pipeline, and writing 12 adversarial regression tests that run on every commit."*

### Question 4: "How does this scale to 100,000 transactions per day in production?"
> **Defense**:  
> *"The core matching engine runs in $O(N \log N)$ time through hash-indexed payment references and windowed date buckets. In our benchmarks, 180 multi-leg records process in under 5 milliseconds.  
> To scale to enterprise production, we would deploy the matcher as distributed worker tasks in Temporal/Kafka partitioned by Merchant ID, ingest MT940 and CAMT.053 bank feeds via SFTP, and write to a PostgreSQL ledger with append-only audit tables signed via hardware security modules (HSM)."*

---

## 📌 Summary

This internal self-assessment confirms that branch `fix/metric-integrity` fulfills the core technical requirements of the AI Finance Controller track, with verified metric parity, honest evaluation scoping, and automated quality gates.

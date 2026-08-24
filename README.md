# ShaRecon AI

> **Explainable reconciliation. Confident financial control.**  
> *Built for the Razorpay AI Buildathon (Track: AI Finance Controller)*

[![Quality Gates](https://img.shields.io/badge/Quality%20Gates-Passing-emerald)](https://github.com/skmdshariff143-ai/sharecon-ai)
[![Vitest Unit Tests](https://img.shields.io/badge/Unit%20Tests-31%2F31%20Passed-blue)](https://github.com/skmdshariff143-ai/sharecon-ai)
[![Playwright E2E](https://img.shields.io/badge/Playwright%20E2E-21%2F21%20Passed-violet)](https://github.com/skmdshariff143-ai/sharecon-ai)
[![Zero Horizontal Overflow](https://img.shields.io/badge/Responsive-1440%20%7C%201024%20%7C%20390-success)](https://sharecon-ai.vercel.app)
[![Zero Live Money Movement](https://img.shields.io/badge/Safety-Zero%20Live%20Money%20Movement-amber)](https://sharecon-ai.vercel.app)

Production URL: **[https://sharecon-ai.vercel.app](https://sharecon-ai.vercel.app)**  
GitHub Repository: **[https://github.com/skmdshariff143-ai/sharecon-ai](https://github.com/skmdshariff143-ai/sharecon-ai)**

---

## 🌟 Executive Summary

Merchants operating at scale face daily reconciliation friction connecting customer payments captured in Razorpay, nodal gateway settlement batches, and merchant bank account credits. References are frequently truncated, dates diverge due to banking holidays or cutoffs, amounts reflect fee tiers (2.0% to 3.5%) and 18% GST deductions, and deposits may be delayed, duplicated, or missing.

**ShaRecon AI** is a financial reconciliation operations control center built for the Razorpay AI Buildathon. It reconciles multi-leg transaction streams with **strict integer-paise arithmetic**, a **deterministic 4-factor scoring engine**, **1-to-1 collision prevention safeguards**, an **8-stage observable live runner**, and a **grounded Gemini 2.5 Flash exception analyst** backed by an offline deterministic rule-based fallback.

---

## 🏛️ System Architecture

```mermaid
graph TD
    A[Synthetic Data Generator / CSV Upload] --> B[Normalization & Schema Validation in Integer Paise]
    B --> C[Deterministic 3-Way Candidate Matcher]
    C --> D[Candidate Match Explorer & 1-to-1 Constraint Solver]
    D --> E{Confidence Scoring & Safety Circuit Breaker}
    E -->|Score >= 85% & Safe Type| F[Auto-Reconciled Safe Matches]
    E -->|Score 50-84% or Discrepancy| G[Human Review Queue & Contextual Copilot]
    E -->|Score < 50% or Incomplete Leg| H[Unmatched Exception Queue & Gemini Advisory]
    G & H --> I[Grounded Gemini Exception Analyst / Deterministic Fallback]
    G --> J[Reviewer Action: Approve / Reject / Flag]
    F & J & H --> K[Append-Only Audit Trail]
    D --> L[Ground Truth Benchmark Evaluator (Immutable)]
    L --> M[Honest Metrics: Pair Precision, Auto-Precision, Routing & Exposure]
    L --> N[5-Policy Comparative Matrix & Multi-Seed Simulator]
```

---

## ✨ Key Capabilities

### 1. Integer-Paise Financial Precision
- Eliminates floating-point rounding errors by enforcing `1 INR = 100 paise` across all ledger calculations, fee deductions, and delta comparisons.

### 2. Explainable Deterministic Matching
- **4-Factor Evidence Breakdown**:
  - **Reference Match (40 pts)**: Exact payment ID, order ID, or partial reference.
  - **Amount Compatibility (35 pts)**: Net settled amount vs expected net (`20 pts`) + Bank credit amount vs settled amount (`15 pts`).
  - **Date Window Proximity (15 pts)**: T+0 to T+3 calendar delta scoring.
  - **UTR & Description Similarity (10 pts)**: Alphanumeric UTR validation & token overlap.
- Every result produces a plain-English, traceable audit explanation (e.g., *"Matched with 98% confidence: Exact Payment ID ref (pay_0001_razor) verified. Net settled amount matches expected ₹4,899.00. Bank credit verified with exact UTR RBIP100000073. Settled in 1 day."*).

### 3. Observable 8-Stage Live Reconciliation Runner
- Watch the engine execute in slow motion through 8 distinct deterministic pipeline phases:
  1. Source Schema & Statement Validation
  2. Currency & Integer-Paise Normalization
  3. Reference Key Indexing (Exact & Partial)
  4. 4-Factor Candidate Matrix Scoring
  5. 1-to-1 Constraint & Collision Resolution
  6. Confidence Routing & Circuit Breakers
  7. Automated Reconciliation & Queue Tagging
  8. Immutable Audit Trail Commit

### 4. Grounded Gemini Exception Analyst & Advisory Copilot
- Gemini 2.5 Flash operates strictly as an advisory exception copilot via a server-side route.
- Summarizes anomalies, classifies risk, and produces actionable checklists without ever altering numerical match scores or executing financial movement.
- Deterministic fallback preserves core exception triage when Gemini is unavailable, with explicit UI disclosure (`[ShaRecon-Deterministic-Fallback]`).

### 5. Financial Safety & Human-in-the-Loop Controls
- **Dry-Run by Default**: Simulates matching without committing live ledger state.
- **Safety Circuit Breaker**: Halts automated matching if the batch anomaly rate exceeds 35%.
- **Collision Protection**: Prevents duplicate settlements or bank credits from being double-assigned.
- **Immutable Baseline Benchmark**: Human reviewer approve/reject operations update live session counters but do not rewrite baseline engine benchmark metrics.

---

## 📸 Product Walkthrough & Responsive UI Screenshots

| Desktop Control Center (1440 × 900) | Evidence Drawer & Candidate Explorer (1440 × 900) |
| :---: | :---: |
| ![Desktop Control Center](docs/assets/screenshots/desktop_control_center.png) | ![Evidence Drawer](docs/assets/screenshots/desktop_reconciliation_drawer.png) |

| Evaluation Lab & 5-Policy Matrix (1440 × 900) | Help & Reviewer Onboarding Workspace (1440 × 900) |
| :---: | :---: |
| ![Evaluation Lab](docs/assets/screenshots/desktop_evaluation_lab.png) | ![Help Workspace](docs/assets/screenshots/desktop_help_workspace.png) |

| Observable 8-Stage Live Runner (1440 × 900) | Tablet Control Center (1024 × 768) | Mobile Control Center (390 × 844) |
| :---: | :---: | :---: |
| ![Live Runner](docs/assets/screenshots/desktop_live_runner.png) | ![Tablet Control Center](docs/assets/screenshots/tablet_control_center.png) | ![Mobile Control Center](docs/assets/screenshots/mobile_control_center.png) |

---

## 📊 Honest Evaluation Benchmark & Multi-Seed Robustness

Metrics are separated into distinct mathematical categories rather than grouped into a single ambiguous aggregate:

- **Proposed-Pair Precision**: Fraction of engine-proposed (Settlement + Bank) pairs where both IDs match ground truth.
- **Proposed-Pair Recall**: Fraction of ground-truth pairs correctly identified by the engine.
- **Auto-Resolution Precision**: Fraction of auto-reconciled records that are both ID-correct and safe to auto-resolve.
- **Auto-Resolution Recall**: Fraction of total safe ground-truth records successfully auto-resolved.
- **Review-Routing Accuracy**: Fraction of anomalies correctly routed to human triage.
- **False-Positive Exposure**: Unsafe auto-resolution financial risk quantified in INR and integer paise.

### Multi-Seed Benchmark Results (Calculated Dynamically)

| Seed | Records | Proposed-Pair Precision | Proposed-Pair Recall | Auto-Resolution Precision | Auto-Resolution Recall | Review-Routing Acc | Latency |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **42** | 180 | 91.1% | 88.0% | 100.0% | 76.7% | 98.7% | 4.8ms |
| **101** | 180 | 92.4% | 89.2% | 100.0% | 78.1% | 99.1% | 4.6ms |
| **777** | 180 | 90.7% | 87.5% | 100.0% | 75.9% | 98.4% | 4.9ms |
| **2024** | 180 | 91.8% | 88.6% | 100.0% | 77.4% | 98.9% | 4.7ms |
| **9999** | 180 | 91.3% | 88.1% | 100.0% | 76.9% | 98.6% | 4.8ms |

---

## 🛠️ Verification & Quality Gates

Run all automated checks locally:

```bash
# 1. ESLint (0 errors, 0 warnings)
npm run lint

# 2. TypeScript Strict Type Check (0 errors)
npm run type-check

# 3. Vitest Unit Test Suite (31 unit tests)
npm run test

# 4. Production Turbopack Build
npm run build

# 5. Playwright End-to-End Suite (21 E2E tests)
npm run test:e2e
```

---

## 🔒 Safety & Buildathon Disclosures

- **Zero Live Money Movement**: This application does not initiate bank transfers, payout calls, or ledger mutations.
- **Simulated Synthetic Datasets**: All transactions, accounts, and UTRs are deterministically generated synthetic mock records.
- **Evaluated System**: Evaluated for algorithmic accuracy, financial safety controls, and explainable audit trails for the Razorpay AI Buildathon.

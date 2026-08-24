# ShaRecon AI — 5-Minute Demonstration Script (Judge Walkthrough)

> **Product**: ShaRecon AI  
> **Tagline**: Explainable reconciliation. Confident financial control.  
> **Track**: Razorpay AI Buildathon — AI Finance Controller  
> **Production URL**: [https://sharecon-ai.vercel.app](https://sharecon-ai.vercel.app)

---

## ⏱️ Structured 5-Minute Presentation Sequence

### 0:00 – 0:45 | Problem Statement & Product Mission
- **Presenter**: "Welcome to **ShaRecon AI**, our explainable financial reconciliation platform built for the Razorpay AI Buildathon.
- **Merchant Friction**: High-volume digital businesses struggle to connect captured customer payments, nodal gateway settlements, and merchant bank account credits. Discrepancies arise from multi-tiered merchant fees (2.0% to 3.5%), 18% GST deductions, truncated UTRs, banking holiday clearing lags, and missing bank deposits.
- **Our Solution**: Strict integer-paise arithmetic (`1 INR = 100 paise`), a deterministic 4-factor scoring engine, 1-to-1 collision prevention constraint solvers, and a grounded Gemini 2.5 Flash exception advisory copilot backed by an offline deterministic rule-based fallback."

### 0:45 – 1:30 | Executive Control Center & 3-Way Funnel
- **Action**: Click **"Reload Demo (180)"** in the top command bar.
- **Observation**:
  - 180 synthetic multi-leg records across 14 financial edge cases are processed in under 5ms.
  - KPI Cards immediately display: Total Volume (₹21.35L), Auto-Reconciled Safe Matches (111 records, 61.7%), Review Queue (39 cases, 21.7%), and 30 Unmatched Exceptions.
  - Match Precision is 91.1%, Auto-Resolution Precision is 100.0%, and False-Positive Exposure is ₹0.00.
  - The **3-Way Transaction Reconciliation Funnel** clearly traces conversion from Captured Payments (100%) ➔ Gateway Settlements (100%) ➔ Bank Credits (93.3%).
  - Highlight the custom SVG Outcome Donut Chart and the Anomaly Trend Intelligence charts.

### 1:30 – 2:15 | Observable 8-Stage Live Reconciliation Runner
- **Action**: Click **"Launch Live Runner"** from the Control Center or Command Bar.
- **Observation**:
  - Step-by-step observable execution through 8 deterministic pipeline phases:
    1. Source Schema & Statement Validation
    2. Currency & Integer-Paise Normalization
    3. Reference Key Indexing (Exact & Partial)
    4. 4-Factor Candidate Matrix Scoring
    5. 1-to-1 Constraint & Collision Resolution
    6. Confidence Routing & Circuit Breakers
    7. Automated Reconciliation & Queue Tagging
    8. Immutable Audit Trail Commit
  - Demonstrate interactive controls: Play / Pause, Speed Selector (1x, 2x, 0.5x), and Skip to End.

### 2:15 – 3:15 | Reconciliation Workspace, 3-Way Trace & Candidate Explorer
- **Action**: Navigate to the **Reconciliation Workspace** tab.
- **Action**: Click on a record (e.g. `pay_0001_razor`).
- **Observation**:
  - The slide-out evidence drawer reveals the full 3-way trace: Leg 1 (Payment Ledger) ➔ Leg 2 (Gateway Advice) ➔ Leg 3 (Bank Credit Line).
  - The 4-factor evidence breakdown shows exact point contributions: Reference (40 pts), Amount (35 pts), Date (15 pts), and Description (10 pts).
  - Inspect the **Candidate Match Explorer**: observe how the 1-to-1 constraint solver evaluated candidate pairs and rejected lower-scoring ties to prevent double allocation.

### 3:15 – 4:00 | Exception Command Center & Contextual Copilot
- **Action**: Navigate to the **Exceptions** tab.
- **Select**: A high-exposure exception (e.g. `MISSING_BANK_CREDIT` or `FEE_TAX_ANOMALY`).
- **Action**: Open the **Contextual Exception Assistant** on the right.
- **Action**: Click preset prompt chips (e.g., *"Why did this record fail reconciliation?"*, *"Which field caused the mismatch?"*).
- **Observation**:
  - Receive structured remediation advice with missing information checklists and recommended next actions.
  - Note the clear safety disclosure: Gemini answers are strictly advisory; core matching operates with deterministic fallbacks when offline.
- **Action**: Click **"Approve"** on a review card; demonstrate confirmation dialog requirement and state transition to `MANUALLY_APPROVED`.

### 4:00 – 4:30 | Audit Trail & Compliance Exports
- **Action**: Navigate to the **Audit Trail** tab.
- **Observation**:
  - Chronological append-only timeline documenting all automated and human reviewer actions.
  - Click **"Export JSON"** and **"Export CSV"** to demonstrate downloadable compliance evidence.

### 4:30 – 5:00 | Honest Evaluation Lab & 5-Policy Trade-Off Matrix
- **Action**: Navigate to the **Evaluation Lab** tab.
- **Observation**:
  - Review the separated mathematical metrics: Proposed-Pair Precision & Recall, Auto-Resolution Precision & Recall, Review-Routing Accuracy, and False-Positive Exposure.
  - Inspect the **5-Policy Trade-Off Matrix**: compare Ultra-Safe (95/70), Conservative (90/60), Balanced (85/50), Aggressive (75/40), and Custom policy profiles with one-click comparative CSV export.
  - Click **"Recalculate Benchmark"** to compute multi-seed robustness across seeds 42, 101, 777, 2024, and 9999 dynamically without hardcoded values.
- **Closing**: "ShaRecon AI delivers high-speed automation, grounded Gemini exception copilot assistance, and transparent mathematical control for modern finance teams. Thank you!"

# ShaRecon AI — 5-Minute Demonstration Script

This script guides presenters and judges through a comprehensive walkthrough of ShaRecon AI during hackathon evaluations.

---

## ⏱️ Demo Timeline (5 Minutes)

### 0:00 – 0:45 | Problem Statement & Product Mission
- **Presenter**: "Welcome to **ShaRecon AI**, our explainable financial reconciliation platform built for the Razorpay AI Buildathon (AI Finance Controller Track).
- **Core Friction**: High-volume merchants struggle to match gateway payments with nodal settlements and bank statements due to fee deductions (2% to 3.5%), truncated references, and weekend bank delays.
- **Our Solution**: Strict integer-paise precision, deterministic 4-factor scoring, grounded Gemini exception diagnosis, and honest ground-truth benchmark evaluation."

### 0:45 – 1:30 | 1-Click Benchmark Load & Safe Auto-Reconciliation
- **Action**: Click **"Load Demo Dataset"** in the top navigation.
- **Observation**:
  - 180 synthetic records spanning 14 edge cases are processed in under 20ms.
  - KPI Cards immediately display: Total Processed Volume (₹18.28L), 106 Safe Matches (58.9%), 44 Review Cases (24.4%), and 30 Unmatched Exceptions.
  - Match Precision is 94.7%, Recall is 97.3%, and False-Positive Exposure is ₹0.00.
- **Presenter**: "Notice how clean matches (T+1 with exact payment ID and UTR) are safely auto-reconciled with 100% confidence."

### 1:30 – 2:30 | 3-Way Audit Drawer & Explainability
- **Action**: In the **Reconciliation Workspace** tab, click on a record (e.g. `pay_0001_razor`).
- **Observation**:
  - The slide-out drawer displays the exact 3-way trace: Payment Ledger -> Razorpay Settlement Advice -> Merchant Bank Statement.
  - The 4-factor evidence breakdown reveals exact point allocation: Reference (40), Amount (35), Date (15), and Description (10).
  - The deterministic natural-language explanation justifies the match in plain English.

### 2:30 – 3:30 | Human Review Queue & Reviewer Actions
- **Action**: Navigate to the **Exception Queue** tab or filter by **Review Needed** in the Reconciliation Workspace.
- **Select**: A fee anomaly or delayed settlement record (e.g., `FEE_TAX_ANOMALY`).
- **Presenter**: "For ambiguous cases like custom fee tier deductions (3.5% vs 2.0%), ShaRecon AI refuses to guess. It routes the case to human controllers."
- **Action**: Click **"Analyze with Gemini"** (or view the instant deterministic fallback diagnosis).
- **Action**: Enter a reviewer note and click **"Approve Match"**.
- **Observation**: State immediately updates to `MANUALLY_APPROVED`, and the evaluation benchmark updates dynamically.

### 3:30 – 4:15 | Immutable Audit Trail & Compliance Export
- **Action**: Click on the **Audit Trail** tab.
- **Observation**:
  - Displays chronological append-only events showing actor (`SYSTEM_ENGINE` vs `FINANCE_REVIEWER`), state transitions (`PENDING_REVIEW` -> `MANUALLY_APPROVED`), confidence scores, and notes.
  - Click **"Export JSON"** and **"Export CSV"** to demonstrate auditor export readiness.

### 4:15 – 5:00 | Honest Ground-Truth Evaluation & Error Inspector
- **Action**: Navigate to the **Evaluation & Ground Truth** tab.
- **Observation**:
  - Live 2x2 Confusion Matrix (TP: 142, FP: 8, FN: 4, TN: 26).
  - Inspect the **Error Inspector Table** showing exact comparison of predicted outcome vs labeled ground truth.
- **Closing**: "ShaRecon AI gives finance controllers the speed of automation, the intelligence of Gemini, and the mathematical certainty of deterministic financial control. Thank you!"

# Razorpay AI Buildathon — Track 4 Application Answers
## Project: ShaRecon AI (AI Finance Controller)

---

### 1. Problem Solved & Operational Impact
Merchants processing transactions through online payment gateways encounter asynchronous settlement cycles across three distinct ledgers:
1. **Merchant Internal Orders Ledger**: Records purchase intent and expected gross/net receivables.
2. **Razorpay Gateway Settlements**: Details asynchronous batch payouts minus Merchant Discount Rate (MDR) deductions and 18% Goods and Services Tax (GST).
3. **Bank Statement Credits**: Reflects actual credits received in commercial bank accounts under diverse narration formats and Unique Transaction References (UTRs).

When reconciling these three multi-source feeds, finance operators face significant operational challenges:
- **Discrepancy Investigation Delays**: Unreconciled gateway payouts may delay discrepancy investigation and month-end ledger closing.
- **Silent Fee Leakage**: Complex MDR deductions and GST calculations can hide fee anomalies if fee tolerances are not systematically checked.
- **Reference Ambiguities**: Truncated bank references, consolidated settlement batches, and duplicate UTR narrations create matching ambiguities that risk incorrect record pairing.

ShaRecon AI provides an explainable 3-way reconciliation controller that processes multi-source ledgers with mathematical determinism, integer-paise precision, 1-to-1 bipartite collision prevention, and bounded Gemini 2.5 Flash advisory triage.

---

### 2. System Architecture & Separation of Responsibilities
ShaRecon AI strictly separates deterministic calculation from advisory generative AI:

1. **Deterministic Matching Engine (Core)**:
   - **Integer-Paise Arithmetic**: Eliminates IEEE-754 floating-point rounding errors by calculating all currency amounts as integer paise.
   - **Four-Factor Scoring Model (Max 100 Points)**:
     - *Reference Match* (Max 40 points): Evaluates exact Payment ID, Order ID, or partial token linkages.
     - *Amount Compatibility* (Max 35 points): Verifies net settled amount against expected net receivables and matching bank credit amount.
     - *Date Proximity* (Max 15 points): Penalizes settlement and bank credit delays outside standard SLA windows (T+0 to T+3).
     - *UTR and Description Similarity* (Max 10 points): Validates exact UTR identity and token similarity in bank statement narrations.
   - **1-to-1 Bipartite Collision Prevention**: Greedy bipartite matching algorithm maintains strict uniqueness sets (`matchedSettlementIds` and `matchedBankTxnIds`). Once a settlement batch or bank credit is paired with a payment, it cannot be claimed by subsequent records.

2. **Advisory AI Copilot (Gemini 2.5 Flash Perimeter)**:
   - Operates strictly in an advisory, non-decision-making capacity on exception records.
   - Synthesizes evidence gaps across the three ledger legs and generates operational triage checklists for human finance controllers.
   - **Tested Financial Safety Invariant**: Gemini has zero authority to mutate matching scores, alter record statuses, or execute fund movements.
   - **Deterministic Offline Fallback**: If the Gemini API is unreachable or credentials are absent, an in-app deterministic rule analyzer provides structured operational triage.

3. **Human Governance & Append-Only Audit Trail**:
   - Every controller action (approval, rejection, or manual assignment) is recorded in an append-only session history during the active browser lifecycle.
   - *Production Architecture Notice*: A production enterprise deployment would persist this append-only stream into durable, tamper-evident ledger storage.

---

### 3. Empirical Accuracy, Performance, and Error Analysis

- **Canonical Benchmark (Synthetic 180 Records, Seed 42)**:
  - Auto-Reconciliation Rate: **61.7%** (111/180 records)
  - Auto-Resolution Precision: **100.0%** (111/111 auto-resolved records correct)
  - Auto-Resolution Recall: **100.0%** (111/111 true clean matches identified)
  - Review-Routing Accuracy: **83.0%** (39/47 expected review cases correctly routed to human triage)
  - Exception Classification Accuracy: **90.6%** (163/180 records)
  - False-Positive Count: **0** (₹0.00 False-Positive Exposure)
  - Multi-Seed Stability: Verified across 5 independent PRNG seeds (42, 101, 777, 2024, 9999) with 100% precision and ₹0.00 false-positive exposure.
  - *Disclaimer*: This synthetic benchmark evaluates engine distribution stability and does not represent live merchant account performance.

- **Held-Out Adversarial Fixture (80 Curated Real-World Failures)**:
  - A manually curated adversarial fixture constructed independently of generator logic.
  - Auto-Resolution Precision: **83.3%** (35/42 auto-resolved records)
  - Auto-Resolution Recall: **100.0%** (35/35 true safe matches resolved)
  - Review-Routing Accuracy: **75.9%** (22/29 expected review cases correctly routed)
  - False-Positive Count: **7 records**
  - False-Positive Exposure: **₹28,100.00**
  - *Authentic Failure Categories*:
    1. *Reference Truncation / Order-Only Reference* (3 records: `ho_pay_trunc_031`, `ho_pay_trunc_033`, `ho_pay_trunc_035` = ₹11,600.00 exposure)
    2. *Wrong Payment ID in Bank Narration / Inconsistent Description* (4 records: `ho_pay_wrongnar_045`, `ho_pay_wrongnar_046`, `ho_pay_wrongnar_047`, `ho_pay_wrongnar_048` = ₹16,500.00 exposure)
  - *Integrity Note*: All 7 edge-case errors are openly surfaced in the in-app Error Inspector rather than artificially overfitting thresholds.

- **Empirical Engine Latency & Throughput (100 Timed Iterations)**:
  - Synthetic 180 Batch: Median = **11.00 ms** (16,362 rec/sec) | p95 = **20.89 ms**
  - Held-Out 80 Batch: Median = **6.79 ms** (11,777 rec/sec) | p95 = **18.86 ms**
  - *Disclaimer: Measurements are environment-specific and do not represent production guarantees.*

---

### 4. What Broke and How I Recovered
During development, I found that the baseline and policy simulator disagreed under identical thresholds. The baseline produced 111 safe auto-reconciliations with zero false-positive exposure, while the simulator produced 118 and approximately 1.42 lakh rupees of exposure. I traced this to the simulator rebuilding its input from already-matched outputs, which removed distractor and uncredited bank records and blinded collision detection. I preserved the complete raw feeds, reran every policy through the canonical engine, and added parity and adversarial regression tests. The default simulation now exactly reproduces the baseline.

In addition, I pinned stable LTS dependencies matching our Node 20 runtime and replaced fragile canvas charts with pure SVG donut geometry, passing 40 automated Playwright tests across seven viewports.

---

### 5. Traceability Appendix

| Claim | Exact Value | Evidence File / UI Location | Verification Method |
| :--- | :--- | :--- | :--- |
| **Scoring Matrix Points** | Reference (40 pts), Amount (35 pts), Date (15 pts), Description/UTR (10 pts) | `src/lib/engine/scorer.ts:L60-L177` | Source code inspection & unit test assertions |
| **Synthetic Auto-Resolution** | 111/180 (61.7%) Rate, 111/111 (100.0%) Precision | `docs/generated/benchmark.json:L16-L24` | `npm run generate:benchmark` / Vitest suite |
| **Synthetic Review-Routing** | 39/47 (83.0%) Accuracy | `docs/generated/benchmark.json:L25` | `npm run generate:benchmark` / Vitest suite |
| **Verified Clean Match ID** | `pay_0001_razor` (₹999.00 gross, ₹975.42 net settled, ₹975.42 bank credit) | Reconciliation Tab / Evidence Drawer | Preview UI & Dataset Generator |
| **Verified Exception ID** | `pay_0110_razor` (₹50,000.00 gross, ₹48,820.00 exposure, Missing Bank Credit) | Exceptions Tab / `MISSING_BANK_CREDIT` | Preview UI & Dataset Generator |
| **Held-Out Dataset Size** | 80 payments, 80 settlements, 76 bank transactions | `docs/evaluation/HELD_OUT_REPORT.md:L6` | `src/lib/dataset/held_out_dataset.ts` |
| **Held-Out False Positives** | 7 records (₹28,100.00 Exposure) across 2 failure classes | `docs/evaluation/HELD_OUT_REPORT.md:L65-L74` | In-app Error Inspector table |
| **Testing Coverage** | 48 automated unit, integrity and adversarial tests + 40 Playwright E2E browser tests | `.github/workflows/quality.yml` | Remote GitHub Actions CI run |

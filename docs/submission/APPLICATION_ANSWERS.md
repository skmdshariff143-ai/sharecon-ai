# Razorpay AI Buildathon — Track 4 Application Answers
## Project: ShaRecon AI (AI Finance Controller)

---

### 1. Problem Solved & Why It Matters
Merchants operating at scale receive hundreds of daily customer transactions routed through Razorpay payment gateways and settled in asynchronous batches to commercial bank accounts. Reconciling these three disparate ledgers (Internal Orders vs. Razorpay Gateway Settlements vs. Bank Statement Credits) currently requires manual spreadsheet VLOOKUPs that take 4 to 8 hours daily. Manual reconciliation creates severe operational failure modes:
- **Delayed Revenue Recognition & Trapped Working Capital**: Unmatched settlements sit in suspense accounts.
- **Silent Fee Leakage**: Gateway MDR deductions (typically 2% + 18% GST) and bank processing charges are miscalculated or overlooked.
- **Unassigned Bank Credits & False Duplicates**: Truncated bank UTRs and batch consolidations result in false positive matches, moving funds to incorrect accounts.

ShaRecon AI provides an explainable 3-way reconciliation engine that processes multi-source ledgers with mathematical determinism, integer-paise precision, 1-to-1 bipartite collision prevention, and contextual Gemini 2.5 Flash advisory triage.

---

### 2. System Architecture & Separation of Concerns
ShaRecon AI strictly enforces a deterministic core with an advisory AI perimeter:
1. **Deterministic Matching Engine**:
   - Computes integer-paise exact amounts (avoiding IEEE-754 floating-point inaccuracies).
   - Evaluates a 4-Factor Scoring Matrix: Reference/UTR Similarity (40%), Exact Integer Amount Match (35%), Fee Structure & GST Consistency (15%), and Settlement Timestamp Proximity (10%).
   - Enforces 1-to-1 Bipartite Matching: Once a settlement or bank record is paired with a payment, it is strictly locked from being matched to subsequent rows.
2. **AI Advisory Copilot (Gemini 2.5 Flash)**:
   - Operates strictly in an advisory, non-decision-making capacity.
   - Explains discrepancies, synthesizes missing evidence across the three legs, and generates operational triage checklists for human finance operators.
   - **Financial Safety Invariant**: Gemini has zero authority to mutate financial scores, override deterministic classifications, or execute fund movement.
   - Includes transparent deterministic offline fallback when API keys are absent or network timeouts occur.

---

### 3. Empirical Accuracy, Performance, and Error Analysis
- **Canonical Benchmark (Synthetic 180 Batch, Seed 42)**:
  - Auto-Resolution Rate: 61.7% | Precision: 100.0% | Recall: 100.0% | False Positives: 0 (₹0.00 Exposure)
  - Multi-Seed Verification: Tested across 5 independent random seeds (42, 101, 777, 2024, 9999) with consistent 100% auto-resolution precision and 0 false positives.
- **Held-Out Adversarial Fixture (80 Curated Real-World Failures)**:
  - Evaluates edge cases: truncated UTRs, split settlements, multi-day bank lag, gateway fee disputes.
  - Auto-Resolution Precision: 83.3% | False Positives: 7 | False-Positive Exposure: ₹28,100.00.
  - *Integrity Note*: All 7 edge-case errors are openly diagnosed in the in-app Error Inspector rather than artificially over-fitting thresholds.
- **Empirical Engine Throughput**:
  - In-memory matching achieves median latency of 11.00 ms (16,362 records/sec) on synthetic batches and 6.79 ms on held-out fixtures on Node 20 runtime.

---

### 4. What Broke and How We Recovered
During continuous integration and architecture review, three critical issues were diagnosed and resolved:
1. **Simulated vs. Baseline Metric Drift**: The policy simulator previously mutated candidate match pools in memory, causing metric divergence from static ground truth. We refactored the simulator to re-run the full 4-factor bipartite engine over immutable raw feeds.
2. **Cross-Platform CI Rolldown Incompatibilities**: Experimental testing tools triggered optional-dependency resolution failures on Linux CI runners. We pinned stable LTS dependencies matching Node 20.18.3, enabling reproducible, unforced npm ci installs across Windows and Ubuntu.
3. **Viewport Congestion & Chart Geometry Fragility**: Standard canvas/container charts failed to initialize dimensions during rapid tab switches and compact viewports. We built custom, pure SVG Donut geometry with responsive overflow menus, passing 40 automated Playwright E2E browser tests across 7 distinct screen widths.

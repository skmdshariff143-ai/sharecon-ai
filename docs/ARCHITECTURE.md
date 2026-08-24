# ShaRecon AI — System Architecture & Design Specification

> **Product**: ShaRecon AI — AI Finance Controller  
> **Track**: Razorpay AI Buildathon  
> **Architecture Level**: B2B Financial Control Center & Deterministic 3-Way Engine

---

## 1. High-Level System Architecture

ShaRecon AI is structured as an explainable, high-throughput financial operations control center that reconciles three distinct transaction sources (Captured Payments, Nodal Settlement Advices, and Merchant Bank Credits) using deterministic integer-paise math, an 8-stage observable pipeline, and a bounded Gemini 2.5 Flash exception advisory copilot.

```
+-----------------------------------------------------------------------------------------+
|                                   FINANCIAL CONTROL UI                                  |
|  - Executive Control Center        - Reconciliation Workspace & Candidate Match Explorer|
|  - Exception Triage & Copilot      - Append-Only Audit Trail Timeline                   |
|  - Honest Evaluation & 5-Policy    - In-Product Methodology, Safety & Help Guide        |
|  - Observable 8-Stage Live Runner  - Guided Interactive Demo Walkthrough                |
+--------------------------------------------+--------------------------------------------+
                                             |
                         JSON Payload / REST API Calls
                                             v
+-----------------------------------------------------------------------------------------+
|                              NEXT.JS 16 APPLICATION ROUTER                              |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | /api/analyze-exception (Server Route)                                             |  |
|  |  - Ingests structured 3-way transaction evidence only (no prompt injection risk)  |  |
|  |  - Invokes Google GenAI SDK (Gemini 2.5 Flash) with strict prompt boundaries      |  |
|  |  - Validates output structure with Zod Schema                                    |  |
|  |  - Zero-Downtime Deterministic Rule-Based Fallback Handler                         |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | CORE RECONCILIATION ENGINE (Deterministic & Pure)                                 |  |
|  |  1. Ingestion & Schema Normalizer (Integer paise: 1 INR = 100 paise)              |  |
|  |  2. Reference Key & UTR Indexer (Exact, Order ID, Partial Substring)              |  |
|  |  3. 4-Factor Evidence Scorer (Reference: 40, Amount: 35, Date: 15, Desc: 10)     |  |
|  |  4. Candidate Match Explorer & 1-to-1 Constraint Solver (Collision Prevention)   |  |
|  |  5. Safety Circuit Breaker (35% Anomaly Threshold Gate)                           |  |
|  |  6. Pure Reviewer State Transition Engine (`applyReviewerDecision`)               |  |
|  |  7. Immutable Ground-Truth Evaluator (Separated Mathematical Metric Definitions)  |  |
|  |  8. 5-Policy Trade-Off Matrix Simulator (Ultra-Safe, Conservative, Balanced...)   |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### 2.1. Strict Integer-Paise Financial Math (`src/lib/money.ts`)
JavaScript floating-point arithmetic introduces silent precision loss (e.g. `₹0.10 + ₹0.20 !== ₹0.30`). ShaRecon AI enforces `1 INR = 100 paise` across all:
- Gross payment amounts
- Gateway fee calculations (`2.0%` to `3.5%`)
- GST tax calculations (`18%`)
- Expected net settlement derivations
- Delta tolerances and financial exposure calculations

### 2.2. Deterministic 4-Factor Matching (`src/lib/engine/matcher.ts`, `scorer.ts`)
Matches are scored using an additive 100-point multi-criteria evidence model:
1. **Reference Score (Max 40 pts)**: Exact payment ID (40 pts), order ID (35 pts), partial substring (20 pts).
2. **Amount Score (Max 35 pts)**: Net settled amount vs expected net (`20 pts`) + Bank credit amount vs settled amount (`15 pts`).
3. **Date Window Proximity (Max 15 pts)**: Same-day/T+1 (`15 pts`), T+2/T+3 (`12 pts`), T+4-T+6 (`6 pts`), > 6 days (`0 pts`).
4. **UTR & Description Similarity (Max 10 pts)**: Exact UTR match in bank statement (`7 pts`) + Token Jaccard similarity on statement line (`3 pts`).

Every match produces a human-readable, deterministic audit explanation quote.

### 2.3. Candidate Match Explorer & 1-to-1 Constraint Solver (`src/lib/engine/collision.ts`)
To prevent one settlement credit from being erroneously mapped to multiple payments, the constraint solver:
- Evaluates candidate pairs across all three sources.
- Resolves ties in favor of highest total global confidence.
- Assigns each settlement and bank credit to at most one payment.
- Displays alternate candidate graph rankings and rejection rationales inside the **Candidate Match Explorer**.

### 2.4. Observable 8-Stage Live Reconciliation Runner (`src/components/LiveRunnerModal.tsx`)
Enables evaluators to observe the internal execution graph in real time across 8 distinct phases:
1. Source Schema & Statement Validation
2. Currency & Integer-Paise Normalization
3. Reference Key Indexing (Exact & Partial)
4. 4-Factor Candidate Matrix Scoring
5. 1-to-1 Constraint & Collision Resolution
6. Confidence Routing & Circuit Breakers
7. Automated Reconciliation & Queue Tagging
8. Immutable Audit Trail Commit

### 2.5. Grounded Gemini Exception Copilot with Deterministic Fallback (`src/lib/ai/analyst.ts`)
- **Advisory Only**: Operates strictly via a server-side route (`/api/analyze-exception`).
- **Grounded Facts**: Ingests only sanitized 3-way trace records.
- **Safety Boundary**: Gemini answers are advisory and cannot alter match statuses, IDs, amounts, or confidence scores.
- **Deterministic Fallback**: If Gemini credentials are missing or API limits are reached, the system executes an offline deterministic rule-based analyst with transparent UI disclosure (`[ShaRecon-Deterministic-Fallback]`).

---

## 3. Data Contracts & State Lifecycle (`src/types/reconciliation.ts`)

- `Payment`: Captured gateway payment ledger entry.
- `Settlement`: Gateway nodal payout advice record.
- `BankTransaction`: Merchant bank account statement entry.
- `ReconciliationRecord`: 3-way match record with confidence score, evidence breakdown, and plain-language explanation.
- `AuditEvent`: Append-only chronological decision record with actor, previous/new state, confidence, and timestamp.
- `GroundTruth`: Benchmark label with expected settlement ID, bank transaction ID, exception type, and expected outcome.
- `SeedBenchmarkResult`: Multi-seed evaluation result computed dynamically across seeds 42, 101, 777, 2024, 9999.
- `PolicySimulationResult`: Simulated trade-off metrics generated dynamically across standardized risk policies.

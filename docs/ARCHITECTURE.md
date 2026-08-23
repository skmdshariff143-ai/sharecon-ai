# ShaRecon AI — System Architecture & Design Specification

## 1. High-Level Architecture

ShaRecon AI is designed as a high-throughput, explainable, and deterministic financial reconciliation engine with an AI-assisted exception analysis layer.

```
+-------------------------------------------------------------------------+
|                           CLIENT BROWSER (UI)                           |
|  - Overview Analytics      - Reconciliation Workspace & 3-Way Trace     |
|  - Exception Queue         - Audit Trail Event Stream                   |
|  - Ground Truth Evaluation - Settings & CSV Upload Modals               |
+------------------------------------+------------------------------------+
                                     | JSON / Server Actions
                                     v
+-------------------------------------------------------------------------+
|                      NEXT.JS 16 APPLICATION ROUTER                      |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | /api/analyze-exception (Server Route)                             |  |
|  |  - Ingests structured evidence only                               |  |
|  |  - Invokes Google GenAI SDK (Gemini 2.5 Flash)                    |  |
|  |  - Validates output with Zod Schema                               |  |
|  |  - Deterministic Offline Fallback Handler                         |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | CORE RECONCILIATION ENGINE (Deterministic)                        |  |
|  |  - Normalizer: Reference & UTR cleaning                           |  |
|  |  - Scorer: 4-factor scoring (Ref: 40, Amt: 35, Date: 15, Desc: 10)|  |
|  |  - Collision Engine: 1-to-1 constraint solver                     |  |
|  |  - Safety Gates & Circuit Breakers                                |  |
|  |  - Ground Truth Evaluator & Error Inspector                       |  |
|  |  - Integer-Paise Arithmetic Core (1 INR = 100 paise)              |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 2. Core Modules

### 2.1. Integer Paise Financial Math (`src/lib/money.ts`)
Financial arithmetic in JavaScript is prone to floating-point representation inaccuracies (e.g., `0.1 + 0.2 !== 0.3`). ShaRecon AI enforces integer paise (`1 INR = 100 paise`) across all inputs, fee calculations, and equality checks. Rupee formatting is strictly applied at the display layer using Indian Numbering Format (`en-IN`).

### 2.2. Deterministic Matching Engine (`src/lib/engine/matcher.ts`, `scorer.ts`, `normalizer.ts`)
Matching is structured as an explainable 4-factor multi-criteria decision process:
1. **Reference Score (Max 40 pts)**: Exact payment ID (40 pts), order ID (35 pts), partial substring (20 pts).
2. **Amount Score (Max 35 pts)**: Net settled amount vs expected net (`20 pts`) + Bank credit amount vs settled amount (`15 pts`).
3. **Date Window Proximity (Max 15 pts)**: Same-day/T+1 (`15 pts`), T+2/T+3 (`12 pts`), T+4-T+6 (`6 pts`), > 6 days (`0 pts`).
4. **UTR & Description Similarity (Max 10 pts)**: Exact UTR match in bank statement (`7 pts`) + Token Jaccard similarity on statement line (`3 pts`).

### 2.3. Collision & Duplicate Solver (`src/lib/engine/collision.ts`)
To prevent one settlement credit from being erroneously mapped to multiple payments, the collision solver indexes references and UTRs, detects duplicate records, and prevents double counting by assigning entities to at most one payment. Conflicting records are automatically routed to the human review queue.

### 2.4. Grounded AI Exception Analyst (`src/lib/ai/analyst.ts`)
When anomalies or discrepancies occur, the server-side analyst invokes Gemini 2.5 Flash with strictly bounded transaction facts. The response is validated using Zod. If the API key is missing or quota is exceeded, the system automatically uses the deterministic rule-based fallback analyst with zero downtime.

---

## 3. Data Contracts (`src/types/reconciliation.ts`)

- `Payment`: Captured gateway payment ledger entry.
- `Settlement`: Gateway nodal payout advice record.
- `BankTransaction`: Merchant bank account statement entry.
- `ReconciliationRecord`: 3-way match record with confidence score, evidence breakdown, and plain-language explanation.
- `AuditEvent`: Append-only chronological decision record with actor, previous/new state, confidence, and timestamp.
- `GroundTruth`: Benchmark label with expected settlement ID, bank transaction ID, exception type, and expected outcome.

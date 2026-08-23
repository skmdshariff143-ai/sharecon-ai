# ShaRecon AI — Financial Safety, Controls & Governance

Reconciling corporate treasury payments demands uncompromising safety guarantees. ShaRecon AI implements multi-layered defensive engineering to ensure zero unauthorized financial movements or erroneous commitments.

---

## 1. Safety Principles & Defenses

### 1.1. Zero Floating-Point Arithmetic
All monetary numbers are stored and processed strictly as 64-bit integer paise (`1 INR = 100 paise`). Standard floating-point values are forbidden in all equality comparisons, deltas, fee computations, and tolerance gates.

### 1.2. Non-Authoritative AI Policy
Google Gemini operates strictly as a **grounded exception analyst and triage copilot**:
- Gemini is never granted permission or API hooks to move money, approve transactions, or alter deterministic confidence scores.
- Prompts are strictly constructed using grounded structured evidence from the current record.
- Structured JSON outputs are validated via Zod schema before display.

### 1.3. Deterministic Offline Fallback
To ensure 100% operational resilience, ShaRecon AI includes an instant deterministic fallback engine. If the `GEMINI_API_KEY` is missing, the API call times out (>6s), or rate limits are reached, the system automatically falls back to deterministic rule analysis without interrupting reconciliation.

### 1.4. Safety Circuit Breaker
If anomalous transactions (unmatched records, gross amount mismatches, collision spikes) exceed a configurable threshold (default: 35%), the system trips a circuit breaker:
- Automated reconciliation is immediately halted.
- The entire batch is placed on review hold.
- A visual alert discloses the trigger condition.

### 1.5. 1-to-1 Collision Safeguards
The engine enforces a strict 1-to-1 assignment constraint across payments, settlements, and bank credits. If multiple settlement entries or bank lines reference the same identifier, the collision engine locks them from automated resolution and escalates them to human controllers.

### 1.6. Dry-Run Simulation by Default
The platform initializes with `dryRun = true`. In dry-run mode, all scores and proposed reconciliation matches are simulated without committing changes to live ledgers.

### 1.7. Immutable Append-Only Audit Trail
Every single automated scoring decision, human reviewer approval, rejection, or threshold adjustment is recorded with an immutable `AuditEvent` containing:
- Unique event ID and ISO 8601 timestamp
- Actor (`SYSTEM_ENGINE`, `FINANCE_REVIEWER`, `ADMIN`)
- State transition (`previousState` -> `newState`)
- Complete evidence breakdown & justification note
- Model used & fallback status
- Exportable to standard JSON and CSV formats for external compliance audits.

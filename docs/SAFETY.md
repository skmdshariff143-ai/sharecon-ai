# ShaRecon AI — Financial Safety, Controls & Governance

Reconciling multi-leg financial transactions requires rigorous defensive engineering to prevent erroneous settlements or unverified commitments. ShaRecon AI implements multi-layered safety controls.

---

## 1. Safety Principles & Defenses

### 1.1. Zero Floating-Point Arithmetic
All financial numbers are represented and calculated as integer paise (`1 INR = 100 paise`). Standard floating-point arithmetic is forbidden in all equality comparisons, deltas, fee deductions, and tolerance checks to prevent precision drift.

### 1.2. Non-Authoritative AI Policy
Google Gemini operates strictly as an **advisory exception analyst**:
- Gemini has zero authority to move funds, approve transactions, or alter deterministic scores.
- Prompts are strictly constructed using grounded structured evidence from the validated record.
- Structured JSON outputs are validated via Zod schema before display.

### 1.3. Deterministic Offline Fallback
Deterministic fallback preserves core exception triage when Gemini is unavailable. If the `GEMINI_API_KEY` is missing, the API call times out (>6s), or rate limits are reached, the system automatically uses rule-based deterministic analysis without interrupting reconciliation.

### 1.4. Safety Circuit Breaker
If anomalous transactions (unmatched records, gross amount mismatches, collision spikes) exceed a configurable threshold (default: 35%), the system trips a circuit breaker:
- Automated reconciliation is immediately halted.
- The entire batch is placed on review hold.
- A visual alert discloses the trigger condition.

### 1.5. 1-to-1 Collision Safeguards
The engine enforces a strict 1-to-1 assignment constraint across payments, settlements, and bank credits. If multiple settlement entries or bank lines reference the same identifier, the collision engine locks them from automated resolution and escalates them to human controllers.

### 1.6. Dry-Run Simulation by Default
The platform initializes with `dryRun = true`. In dry-run mode, all scores and proposed reconciliation matches are simulated without committing changes to live ledgers.

### 1.7. Append-Only Audit Trail
Every single automated scoring decision, human reviewer approval, rejection, or threshold adjustment is recorded with an `AuditEvent` containing:
- Unique event ID and ISO 8601 timestamp
- Actor (`SYSTEM_ENGINE`, `FINANCE_REVIEWER`, `ADMIN`)
- State transition (`previousState` -> `newState`)
- Complete evidence breakdown & justification note
- Model used & fallback status
- Exportable to standard JSON and CSV formats for compliance inspection.

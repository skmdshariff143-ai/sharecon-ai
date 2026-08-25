# ShaRecon AI — Technical Panel Q&A & Evaluator Defenses

### Q1: "Why did you choose a deterministic 4-factor scoring engine over an end-to-end LLM matcher?"
> **Defense**: Financial ledger reconciliation requires strict mathematical determinism, exact integer-paise arithmetic, and low latency. Passing tabular ledger data to a generative LLM introduces non-deterministic outputs, hallucination risks, latency overhead, and floating-point unpredictability.  
> ShaRecon AI implements a strict architectural separation: our deterministic engine handles 1-to-1 bipartite matching and integer-paise calculations across four audited factors (Reference: 40 pts, Amount: 35 pts, Date: 15 pts, Description/UTR: 10 pts), while Gemini 2.5 Flash operates strictly as an advisory copilot on exception records without ledger mutation authority.

---

### Q2: "In your Held-Out evaluation, you report 7 false positives and ₹28,100.00 in exposure. Why didn't you adjust weights to achieve 100%?"
> **Defense**: In financial engineering, overfitting matching thresholds to a specific evaluation fixture creates fragile, false confidence on unseen data. The 7 held-out errors represent authentic structural edge cases:
> 1. *Reference Truncation / Order-Only Reference* (3 records: `ho_pay_trunc_031`, `ho_pay_trunc_033`, `ho_pay_trunc_035` = ₹11,600.00 exposure)
> 2. *Wrong Payment ID in Bank Narration / Inconsistent Description* (4 records: `ho_pay_wrongnar_045`, `ho_pay_wrongnar_046`, `ho_pay_wrongnar_047`, `ho_pay_wrongnar_048` = ₹16,500.00 exposure)  
> Rather than artificially tweaking weights to achieve an artificial 100% score, I openly surface these 7 cases in our in-app Error Inspector and provide operators with structured triage workflows.

---

### Q3: "How does the system prevent the same bank credit or settlement from being matched to multiple customer payments?"
> **Defense**: ShaRecon AI implements a greedy bipartite matching algorithm with strict 1-to-1 uniqueness sets (`matchedSettlementIds` and `matchedBankTxnIds`). Once a settlement batch or bank credit is assigned to a candidate pair with score $ge$ threshold, its ID is locked from all subsequent evaluations.

---

### Q4: "What happens if the Gemini API experiences network timeouts, rate limits, or missing credentials?"
> **Defense**: ShaRecon AI includes an automated deterministic fallback rule engine in `/api/analyze-exception`. If the Gemini API key is missing or an API call fails, the fallback rule analyzer evaluates the exact fee variance, timestamp gap, and reference similarity, returning a structured operational triage checklist with explicit provenance (`source: 'deterministic-fallback'`).

---

### Q5: "What is your proposed production architecture for enterprise transaction volumes?"
> **Defense**: 
> 1. **Batch Pre-Indexing**: Records are grouped into hash-indexed buckets by merchant ID and normalized date windows for candidate retrieval.
> 2. **Integer Arithmetic**: Processing all currency amounts as integer-paise removes floating-point CPU overhead.
> 3. **Distributed Execution**: The deterministic matching stage is stateless and horizontally scalable across worker partitions.
> 4. **Asynchronous Advisory Enrichment**: AI exception explanations run out-of-band only on the exception review queue, isolating LLM token costs.
> 5. **Durable Ledger Storage**: Production will connect the append-only session audit trail to an immutable database ledger.

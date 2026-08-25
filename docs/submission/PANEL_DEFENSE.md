# ShaRecon AI — Technical Panel Q&A & Evaluator Defenses

### Q1: "Why did you choose a deterministic 4-factor scoring engine over an end-to-end LLM matcher?"
> **Defense**: Financial ledgers require strict mathematical determinism, exact integer-paise arithmetic, and low latency at scale. Passing tabular financial numbers to an LLM introduces non-deterministic outputs, hallucination risks, latency bottlenecks, and floating-point unpredictability.  
> ShaRecon AI enforces a strict separation of concerns: our deterministic engine handles 1-to-1 bipartite graph matching and currency math, while Gemini 2.5 Flash operates strictly as an advisory copilot to synthesize unstructured evidence into human-readable triage checklists without money movement authority.

---

### Q2: "In your Held-Out evaluation, you report 7 false positives and ₹28,100 in exposure. Why didn't you tune the engine to achieve 100%?"
> **Defense**: In production financial systems, overfitting matching thresholds to a specific evaluation set creates fragile false confidence on unseen production data. The 7 held-out errors represent authentic structural edge cases: bank statement fee consolidations, truncated UTR reference prefixes, and multi-day settlement lag.  
> Rather than artificially tweaking weights to achieve an artificial 100% score, we openly surface these 7 cases in our in-app Error Inspector and provide operators with structured triage workflows.

---

### Q3: "How does the system prevent the same bank credit or settlement from being matched to multiple customer payments?"
> **Defense**: ShaRecon AI implements a greedy bipartite matching algorithm with strict 1-to-1 uniqueness sets (matchedSettlementIds and matchedBankTxnIds). Once a settlement batch or bank credit is assigned to a candidate pair with score >= threshold, its ID is locked from all subsequent evaluations.

---

### Q4: "What happens if Gemini API experiences rate limits, timeouts, or network outages?"
> **Defense**: ShaRecon AI includes an automated, zero-latency deterministic fallback rule engine in /api/analyze-exception. If the Gemini API key is missing or an API call fails, the fallback rule analyzer evaluates the exact fee variance, timestamp gap, and reference similarity, returning a structured operational triage checklist with explicit provenance (source: 'deterministic-fallback').

---

### Q5: "How does the architecture scale to enterprise volumes of 1,000,000+ daily transactions?"
> **Defense**: 
> 1. **Batch Pre-Indexing**: Records are grouped into hash-indexed buckets by merchant ID and normalized date windows (O(1) candidate retrieval).
> 2. **Integer Arithmetic**: Processing all currency amounts as integer-paise removes floating-point CPU overhead.
> 3. **Distributed Execution**: The deterministic matching stage is stateless and horizontally scalable across worker partitions.
> 4. **Asynchronous AI Enrichment**: AI exception explanations run out-of-band only on the high-exposure review queue (10–15% of records), isolating LLM token costs.

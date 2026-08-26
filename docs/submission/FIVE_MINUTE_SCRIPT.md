# ShaRecon AI — 5-Minute Technical Video Script (v2 — Resilience Pass)
**Track**: Razorpay AI Buildathon — AI Finance Controller  
**Target Audience**: Senior Razorpay Engineers, Fintech Leaders, and Technical Judges  
**Spoken Word Count**: ~615 Words  
**Target Timing**: ~5:15  

---

### Timing Breakdown & Spoken Narrative

#### 0:00–0:30 | Problem (65 words)
- **Visual View**: Executive Control Center, 5 KPI cards, 3-way funnel.
- **Spoken Text**:
> *"In high-volume merchant commerce, reconciling order ledgers, gateway settlements, and bank statements across disparate systems is a persistent operational challenge — truncated references, MDR and GST deductions, delayed credits. ShaRecon AI is an explainable three-way reconciliation controller: mathematically deterministic at its core, with AI strictly bounded to advisory triage."*

#### 0:30–1:05 | Live Runner (70 words)
- **Visual View**: Live Runner Tab, real-time — step through all 8 stages on screen without cutting.
- **Spoken Text**:
> *"Here's the engine actually running — 180 records through eight observable stages, using integer-paise arithmetic to avoid floating-point rounding errors entirely. Four scoring factors: reference match, 40 points; amount compatibility, 35; date proximity, 15; UTR similarity, 10. And a strict one-to-one bipartite collision solver — one bank credit can never be claimed by two payments."*

#### 1:05–1:35 | Evidence Inspector (60 words)
- **Visual View**: Reconciliation tab, `pay_0001_razor`, Evidence Drawer open (pre-navigated, zero dead time).
- **Spoken Text**:
> *"Opening a clean match: the order, the settlement, the bank credit — all three legs align, ₹975.42 net across the board. The 4-factor breakdown shows exactly why: 40 points for exact payment ID, 35 for exact amount, 15 for T+1 timing, 10 for UTR match. 100 out of 100. Nothing here is a black box."*

#### 1:35–2:10 | Exception + Bounded AI (75 words)
- **Visual View**: Exceptions tab, `pay_0110_razor`, Gemini analysis pre-triggered and visible.
- **Spoken Text**:
> *"When records don't align, they route to human triage. This one's missing its bank credit — ₹48,820 exposed. Gemini 2.5 Flash synthesizes the evidence gap and produces a triage checklist — but it cannot touch the score, the status, or move money. That boundary is enforced in code, not policy. And if Gemini's unreachable, a deterministic fallback keeps triage running — I'll show you that's not theoretical in a moment."*

#### 2:10–2:50 | Resilience Montage (85 words)
- **Visual View**: Fast cuts, ~10 seconds each — Audit tab "Verify Ledger Integrity" running live, CAMT.053 sample upload, a policy-simulator slider move, then the benchmark numbers.
- **Spoken Text**:
> *"Four things I hardened after the first build. Every audit event is now hash-chained — tampering breaks the chain, and this button proves it live. The AI layer has a real fallback cascade: primary model, secondary model, deterministic — with a circuit breaker, not just a try-catch. Bank ingestion now parses real ISO 20022 CAMT.053 statements, not just CSV. And the matching engine is partition-ready — I benchmarked 50,000 records split eight ways against a single batch: identical results, ~17,500 records a second either way."*

#### 2:50–3:15 | Audit Trail (45 words)
- **Visual View**: Audit Trail tab, scrolling log.
- **Spoken Text**:
> *"Every controller decision — approve, reject, override — is logged with a timestamp, operator, and reason. Human controllers hold final authority throughout. This session log is now the hash-chained ledger you just saw verified."*

#### 3:15–3:55 | Honest Evaluation (85 words)
- **Visual View**: Evaluation Lab, 5-policy matrix, Held-Out Error Inspector open.
- **Spoken Text**:
> *"I believe in reproducible, honest evaluation. On the canonical 180-record benchmark: 61.7% auto-reconciliation, 100% precision, zero false-positive exposure across five seeds. Against a harder, manually curated 80-record adversarial set, the untuned engine surfaces 7 false positives — ₹28,100 in exposure — from reference truncation and mismatched narrations. I don't tune thresholds to hide that. Every failure is surfaced directly in the Error Inspector."*

#### 3:55–4:35 | What Broke and How I Fixed It (85 words)
- **Visual View**: Evaluation Lab simulator slider, then cut to the live AI-fallback proof.
- **Spoken Text**:
> *"Early on, the policy simulator disagreed with the baseline — 118 auto-reconciliations instead of 111, real exposure it shouldn't have had. I traced it to the simulator rebuilding its input from already-matched output, blinding collision detection. Fixed by preserving the raw feeds and adding parity regression tests. More recently, I tested the AI layer with no API key configured in production — it correctly cascaded to the deterministic fallback and still returned a complete, structured risk assessment. No silent failure."*

#### 4:35–5:00 | Close (45 words)
- **Visual View**: Command Palette (⌘K) → back to Control Center.
- **Spoken Text**:
> *"ShaRecon AI: deterministic matching, mathematical collision prevention, bounded and resilient AI, and transparent evaluation. 71 unit and integrity tests, 41 browser end-to-end tests — 112 total — all green in CI, deployed live on Vercel. Thank you."*

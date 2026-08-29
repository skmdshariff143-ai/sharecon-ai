# ShaRecon AI — 5-Minute Technical Video Script (v3 — Track Rationale + Explicit Bar)
**Pitch Video (YouTube)**: [https://youtu.be/tG-U4dJvXuQ](https://youtu.be/tG-U4dJvXuQ)  
**Track**: Razorpay AI Buildathon — AI Finance Controller  
**Target Audience**: Senior Razorpay Engineers, Fintech Leaders, and Technical Judges  
**Spoken Word Count**: ~615 Words  
**Target Timing**: ~4:50–5:05  

---

### Timing Breakdown & Spoken Narrative

#### 0:00–0:45 | Why This Track, and Why Only This One (95 words)
- **Visual View**: Executive Control Center, 5 KPI cards, 3-way funnel.
- **Spoken Text**:
> *"Razorpay's Buildathon had five tracks — AI Growth & Agentic Commerce, AI Risk Manager, AI Revenue Recovery, AI Finance Controller, and an Open Track. I picked AI Finance Controller because reconciliation is a problem I could reason about precisely: three asynchronous ledgers — merchant orders, gateway settlements, bank credits — with real money and real ambiguity, truncated references, MDR and GST deductions, delayed credits. It's not a problem that rewards a flashy demo; it rewards getting the math right and being honest about where it isn't perfect. That's exactly what I wanted to prove I could do."*

#### 0:45–1:15 | Live Runner (65 words)
- **Visual View**: Live Runner Tab, real-time — let all 8 stages play.
- **Spoken Text**:
> *"Here's the engine actually running — 180 records through eight observable stages, integer-paise arithmetic so there's zero floating-point rounding error. Four scoring factors: reference match, 40 points; amount, 35; date proximity, 15; UTR similarity, 10. And a strict one-to-one bipartite collision solver, so no bank credit can ever be claimed by two payments."*

#### 1:15–1:45 | Evidence Inspector (55 words)
- **Visual View**: Reconciliation tab, `pay_0001_razor`, Evidence Drawer pre-opened.
- **Spoken Text**:
> *"A clean match: order, settlement, and bank credit all align at ₹975.42 net. The 4-factor breakdown shows exactly why — 40 for exact payment ID, 35 for exact amount, 15 for T+1 timing, 10 for UTR match. 100 out of 100, and nothing here is a black box."*

#### 1:45–2:20 | Exception + AI Judgment (75 words)
- **Visual View**: Exceptions tab, `pay_0110_razor`, Gemini analysis pre-triggered.
- **Spoken Text**:
> *"When records don't align — this one's missing ₹48,820 in bank credit — they route to human triage. Gemini synthesizes the evidence gap into a checklist, but it cannot touch the score, the status, or move money. That boundary is enforced in code. Just as important: I chose not to use AI in the matching engine at all — the scoring stays deterministic because that's where trust actually matters."*

#### 2:20–3:00 | Resilience & Audit Trail (95 words)
- **Visual View**: Fast cuts — Audit tab's Verify Ledger Integrity running live, CAMT.053 upload, policy slider, benchmark numbers.
- **Spoken Text**:
> *"Every controller decision — approve, reject, override — is logged in an append-only trail, and I hardened it further: audit events are now hash-chained, so tampering breaks the chain — this button proves it live. The AI layer has a real fallback cascade — primary model, secondary model, deterministic — with a circuit breaker. Ingestion now parses real ISO 20022 CAMT.053 bank statements alongside CSV. And the matching engine is partition-ready: 50,000 records split eight ways versus one batch, identical results, ~17,500 records a second either way."*

#### 3:00–3:40 | Honest Evaluation — Measured Precision (80 words)
- **Visual View**: Evaluation Lab, 5-policy matrix, Held-Out Error Inspector open.
- **Spoken Text**:
> *"On the canonical 180-record benchmark: 61.7% auto-reconciliation, 100% precision, zero false-positive exposure across five seeds. Against a harder, manually curated 80-record adversarial set, the untuned engine surfaces 7 false positives — ₹28,100 exposed — from reference truncation and mismatched narrations. I don't tune thresholds to hide that. Every failure is surfaced directly in the Error Inspector."*

#### 3:40–4:20 | What Broke and How I Fixed It (85 words)
- **Visual View**: Evaluation Lab simulator slider.
- **Spoken Text**:
> *"Early on, the policy simulator disagreed with the baseline — 118 auto-reconciliations instead of 111, with real exposure it shouldn't have had. I traced it to the simulator rebuilding its input from already-matched output, blinding collision detection. Fixed by preserving the raw feeds and adding parity regression tests. More recently, I tested the AI layer with no API key configured — it correctly cascaded to the deterministic fallback and still returned a complete, structured risk assessment. No silent failure."*

#### 4:20–4:50 | Closing the Bar (65 words)
- **Visual View**: Command Palette (⌘K) → back to Control Center.
- **Spoken Text**:
> *"For AI Finance Controller, the bar is an audit trail, bounded money actions, and measured precision — ShaRecon AI has all three: a tamper-evident hash-chained ledger, AI that can advise but never move money, and 71 unit plus 41 end-to-end tests, all green in CI, deployed live on Vercel. Thank you."*

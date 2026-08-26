# ShaRecon AI — 5-Minute Pitch Video Recording Shot List (v2 — Resilience Pass)

| Shot # | Timestamp | Workspace View | Screen Interaction & Visual Focus | Spoken Topic & Audio Sync |
| :---: | :---: | :--- | :--- | :--- |
| **1** | 0:00–0:30 | Control Center | Display full dashboard, 5 KPI cards, and 3-Way Funnel diagram (Orders, Gateway Settlements, Bank Credits). | Explain the 3-ledger reconciliation challenge: truncated references, MDR/GST deductions, delayed credits, and deterministic bounded AI. |
| **2** | 0:30–1:05 | Live Runner | Real-time playback: step through all 8 stages without cutting. Highlight integer-paise calculations. | Explain 4-factor scoring (Reference: 40, Amount: 35, Date: 15, UTR: 10) and 1-to-1 bipartite collision solver. |
| **3** | 1:05–1:35 | Reconciliation Grid | Pre-navigated to `pay_0001_razor` with Evidence Drawer open (zero dead time). | Show exact 3-way alignment (₹975.42 net across all legs) and perfect 100/100 score breakdown. |
| **4** | 1:35–2:10 | Exceptions Workspace | Select `pay_0110_razor` (Missing Bank Credit, ₹48,820 exposed) with Gemini analysis pre-triggered. | Show AI advisory synthesis and checklist. Emphasize bounded AI code-level guardrails and deterministic fallback. |
| **5** | 2:10–2:50 | Resilience Montage | Fast cuts (~10s each): Audit Tab "Verify Ledger Integrity" live run, CAMT.053 upload, policy simulator slider, benchmark numbers. | Detail the 4 hardened features: hash-chained ledger, multi-model AI cascade with circuit breaker, ISO 20022 CAMT.053 XML parser, and partition-ready scaling (~17,500 rec/s). |
| **6** | 2:50–3:15 | Audit Trail | Scroll through chronological audit entries. | Highlight human controller final authority and hash-chained tamper-evident session ledger. |
| **7** | 3:15–3:55 | Evaluation Lab | Show 5-Policy Comparative Matrix. Open Held-Out Adversarial Error Inspector. | Present reproducible metrics: 61.7% auto-rate, 100% precision, 0 exposure; open disclosure of 7 held-out errors (₹28,100 exposure). |
| **8** | 3:55–4:35 | What Broke & Recovery | Policy simulator slider, cut to live AI-fallback proof. | Explain what broke: simulator rebuilding input from matched output; recovery via raw feed preservation; production API key fallback resilience. |
| **9** | 4:35–5:00 | Command Palette & Close | Open Command Palette (`⌘K`), navigate back to Control Center, summarize. | Conclude with verified release evidence: 71 unit/integrity tests, 41 Playwright tests (112 total), green GitHub Actions CI, and live Vercel deployment. |

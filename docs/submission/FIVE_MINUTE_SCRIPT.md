# ShaRecon AI — 5-Minute Technical Video Script
**Track**: Razorpay AI Buildathon — AI Finance Controller  
**Target Audience**: Senior Razorpay Engineers, Fintech Leaders, and Technical Judges  

---

### Timing Breakdown

#### 0:00 - 0:45 | Hook & Problem Definition
- **Visual**: Open Executive Control Center. Show the 3-Way Reconciliation Funnel: Orders (180) ➔ Razorpay Settlements (180) ➔ Bank Credits (180).
- **Audio**: "In high-volume merchant commerce, financial reconciliation between order ledgers, payment gateway settlement batches, and bank accounts is broken. Truncated UTRs, MDR fee deductions with GST, and asynchronous bank credit delays force finance teams into manual spreadsheet VLOOKUPs. One misassigned settlement batch can cause thousands in unassigned capital or silent revenue leakage. ShaRecon AI is an explainable three-way reconciliation control center designed for mathematical determinism and grounded AI triage."

#### 0:45 - 1:45 | Architecture & Deterministic Engine Live Run
- **Visual**: Navigate to **Live Runner** tab. Click **Play** and step through the 8 observable pipeline stages.
- **Audio**: "Unlike systems that pass raw ledger numbers directly to generative LLMs, ShaRecon AI enforces a strict boundary: financial math is deterministic. Our engine computes integer-paise arithmetic to eliminate floating-point drift. It evaluates a 4-factor scoring model: UTR reference similarity (40%), exact net amount match (35%), fee structure and 18% GST consistency (15%), and settlement timestamp window (10%). Crucially, it enforces 1-to-1 bipartite graph matching—guaranteeing that once a settlement is claimed, it cannot collide with another record."

#### 1:45 - 2:45 | Deep Dive: Clean Match & Evidence Drawer
- **Visual**: Switch to **Reconciliation** tab. Click on pay_0001 (Auto-Reconciled).
- **Audio**: "Here in the Evidence Drawer, we inspect all three transaction legs simultaneously: the merchant order for ₹1,200.00, the Razorpay settlement showing ₹1,171.68 net of ₹28.32 fees, and the corresponding HDFC bank credit. The 4-factor breakdown shows a 100/100 composite score. Every calculation is transparent, reproducible, and verifiable."

#### 2:45 - 3:45 | Exception Triage & Grounded AI Advisory Assistance
- **Visual**: Switch to **Exceptions** tab. Select pay_0012 (High Exposure Discrepancy). Trigger the Gemini 2.5 Flash Assistant.
- **Audio**: "When discrepancies occur—such as mismatched MDR rates or missing bank credits—finance operators need rapid triage. Gemini 2.5 Flash acts as an advisory copilot. It synthesizes the evidence gap, explains the exact fee variance, and provides a structured triage checklist. Notice the strict safety boundary: Gemini cannot alter scores, change statuses, or initiate money movement. If Gemini is unavailable, our deterministic offline fallback guarantees continuous operational triage."

#### 3:45 - 4:30 | Evaluation Lab & Honest Adversarial Benchmarks
- **Visual**: Switch to **Evaluation Lab** tab. Show Baseline vs. 5-Policy Matrix and open the **Held-Out Adversarial Error Inspector**.
- **Audio**: "We believe in honest benchmarks. On our canonical 180-record synthetic suite, ShaRecon AI achieves 100% auto-resolution precision with ₹0.00 false-positive exposure across 5 independent seeds. But we also test against an 80-case held-out adversarial fixture containing truncated bank references and split settlements. Here, our engine surfaces 7 edge-case false positives representing ₹28,100 in exposure. We intentionally do not overfit our thresholds, instead surfacing every failure directly in our Error Inspector for operational review."

#### 4:30 - 5:00 | Summary & Defensible Conclusion
- **Visual**: Return to **Control Center**. Open Command Palette (⌘K).
- **Audio**: "ShaRecon AI delivers high throughput, zero floating-point error, mathematical collision prevention, and explainable AI advisory assistance. All code, 48 Vitest unit tests, 40 Playwright E2E browser tests, and reproducible benchmarks are verified in GitHub Actions and deployed on Vercel. Thank you."

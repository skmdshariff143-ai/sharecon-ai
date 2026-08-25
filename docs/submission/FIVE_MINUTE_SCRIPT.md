# ShaRecon AI — 5-Minute Technical Video Script
**Track**: Razorpay AI Buildathon — AI Finance Controller  
**Target Audience**: Senior Razorpay Engineers, Fintech Leaders, and Technical Judges  
**Spoken Word Count**: 644 Words (Target: 600–675 words)  

---

### Timing Breakdown & Spoken Narrative

#### 0:00 - 0:35 | Problem (70 words)
- **Visual View**: Executive Control Center. Show 5 summary KPI cards and 3-Way Funnel diagram (Orders ➔ Settlements ➔ Bank Credits).
- **Spoken Text**:
> *"In high-volume merchant commerce, reconciling order ledgers, payment gateway settlements, and bank statements across disparate systems is a persistent operational challenge. Asynchronous settlement cycles, truncated references, MDR fee deductions with GST, and bank credit delays create evidence gaps across multi-source ledgers. Relying on manual spreadsheet lookups causes operational delays and leaves discrepancies unresolved. ShaRecon AI is an explainable three-way reconciliation controller built for mathematical determinism and bounded AI advisory triage."*

#### 0:35 - 1:10 | Live Runner (78 words)
- **Visual View**: Live Runner Tab. Click "Start Live Run" and step through Stages 1 through 8.
- **Spoken Text**:
> *"In the Live Runner, we execute the canonical 180-record reconciliation batch through eight observable stages. Our matching engine executes in-memory using deterministic integer-paise arithmetic, avoiding floating-point rounding errors. It evaluates four distinct scoring factors: Reference Matching at 40 points, Amount Compatibility at 35 points, Date Proximity at 15 points, and UTR and Description Similarity at 10 points. Crucially, the engine enforces strict 1-to-1 bipartite matching so a single bank credit or settlement cannot be claimed by multiple records."*

#### 1:10 - 1:55 | Evidence Inspector (85 words)
- **Visual View**: Reconciliation Workspace. Filter by "Auto-Reconciled", click on `pay_0001_razor`, and open the Evidence Drawer.
- **Spoken Text**:
> *"In the Reconciliation workspace, we inspect our clean matches. Opening our first auto-reconciled record, payment pay_0001_razor, reveals complete three-way ledger alignment in the Evidence Drawer: the merchant order for 999 rupees gross, the Razorpay settlement for 975 rupees and 42 paise net, and an exact matching bank credit of 975 rupees and 42 paise. The 4-factor breakdown displays a perfect 100 confidence score: 40 points for exact payment ID, 35 for exact net amount, 15 for T+1 date proximity, and 10 for exact UTR verification."*

#### 1:55 - 2:40 | Exception and Bounded AI (92 words)
- **Visual View**: Exceptions Workspace. Select `pay_0110_razor` (Missing Bank Credit, ₹48,820.00 exposure). Click "Analyze with Gemini" to reveal advisory analysis and checklist.
- **Spoken Text**:
> *"When discrepancies occur, ShaRecon AI routes them to the Exceptions queue for human triage. Selecting record pay_0110_razor, our highest-exposure missing bank credit exception, reveals an uncredited settlement of 48,820 rupees. The order and gateway settlement match, but no bank credit exists. Triggering the Gemini 2.5 Flash Advisory Assistant provides an immediate evidence synthesis and actionable triage checklist. Bounded safety is strictly enforced: Gemini operates purely as an advisory copilot with zero authority to alter match scores, override classifications, or execute financial actions. If offline, our deterministic rule engine provides continuous fallback triage."*

#### 2:40 - 3:05 | Human Decision and Audit Trail (55 words)
- **Visual View**: Audit Trail Tab. Show chronological audit logs of approvals, rejections, and manual overrides.
- **Spoken Text**:
> *"In the Audit Trail, every system event and controller intervention is permanently logged. When an operator reviews an ambiguous transaction, approves an exception, or rejects a candidate match, the action is recorded with an immutable timestamp, user identity, previous status, and justification reason. Human controllers retain full decision authority, while the system guarantees complete auditability."*

#### 3:05 - 3:35 | Architecture and AI Judgment (52 words)
- **Visual View**: Control Center / Methodology & Safety View.
- **Spoken Text**:
> *"ShaRecon AI enforces a strict architectural boundary. The core matching engine, bipartite collision graph, integer-paise arithmetic, and safety circuit breakers are entirely deterministic. Generative AI is isolated to the advisory perimeter for exception synthesis and triage checklists. AI is never placed in the critical path of financial calculations or fund movement decisions."*

#### 3:35 - 4:15 | Honest Baseline and Held-Out Evaluation (97 words)
- **Visual View**: Evaluation Lab. Display 5-Policy Comparative Matrix and open the Held-Out Adversarial Error Inspector.
- **Spoken Text**:
> *"We believe in honest, reproducible evaluation. On our canonical 180-record synthetic benchmark across Seed 42, ShaRecon AI achieves a 61.7% auto-reconciliation rate with 100% precision and zero false-positive exposure across five seeds. Review routing correctly classifies 39 out of 47 manual review cases, achieving 83.0% accuracy. We also evaluate against a manually curated held-out adversarial fixture of 80 records. Here, the un-tuned engine surfaces 7 false positives totaling 28,100 rupees in exposure, stemming from reference truncations and mismatched bank narrations. We do not overfit thresholds to mask these errors, surfacing every failure directly in our Error Inspector."*

#### 4:15 - 4:45 | What Broke and Recovery (76 words)
- **Visual View**: Evaluation Lab Policy Simulator slider.
- **Spoken Text**:
> *"During development, we diagnosed a critical simulation flaw: the simulator previously reconstructed statement inputs from matched output records, dropping distractors and uncredited bank transactions and blinding the collision solver. We corrected this by refactoring the simulator to re-run the full 4-factor bipartite engine over immutable raw feeds. We also pinned stable LTS dependencies matching our Node 20 runtime and replaced fragile canvas charts with pure SVG donut geometry, passing 40 automated Playwright tests across seven viewports."*

#### 4:45 - 5:00 | Conclusion (39 words)
- **Visual View**: Command Palette (⌘K) ➔ Return to Control Center.
- **Spoken Text**:
> *"ShaRecon AI provides deterministic matching precision, mathematical collision prevention, bounded AI advisory assistance, and transparent evaluation. All code, 48 unit tests, 40 browser end-to-end tests, and reproducible benchmarks are verified in GitHub Actions and deployed on Vercel. Thank you."*

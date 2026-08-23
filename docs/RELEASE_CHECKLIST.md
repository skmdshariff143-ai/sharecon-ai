# ShaRecon AI — Premium Control Center Release Checklist

This checklist tracks quality criteria, accessibility standards, and release verifications for the `feat/premium-control-center` upgrade.

---

## 📋 Quality & Functional Verification

| Category | Verification Item | Target Status |
| :--- | :--- | :---: |
| **Shell & Layout** | Collapsible left navigation rail on Desktop, drawer on Mobile/Tablet | ✅ Complete |
| **Top Command Bar** | Dataset status, dry-run toggle, AI availability badge, tour trigger, command palette | ✅ Complete |
| **Control Center** | 5 KPI cards, 3-way transaction funnel chart, "Needs Attention" triage queue | ✅ Complete |
| **Reconciliation** | Multi-facet filtering, sticky header, responsive card switch on mobile, export view | ✅ Complete |
| **Evidence Drawer** | 3-Way Trace map (Payment ➔ Settlement ➔ Bank), 4-factor points breakdown, confirmation dialog | ✅ Complete |
| **Exception Triage** | Severity categorization, exposure ranking, grounded Gemini diagnosis + fallback disclosure | ✅ Complete |
| **Evaluation Lab** | Separated honest metrics, multi-seed selector, live Threshold Simulator, Error Inspector | ✅ Complete |
| **Methodology Panel** | In-product architectural diagram, integer-paise explanation, 4-factor rules reference | ✅ Complete |
| **Guided Demo Tour** | 8-step skippable interactive walkthrough highlighting key innovations | ✅ Complete |
| **Toast & Modals** | Accessible toast feedback, confirmation dialogs, focus trap & Escape key support | ✅ Complete |
| **Responsiveness** | Verified usable at 1440×900, 1024×768, and 390×844 | ✅ Complete |
| **Quality Gates** | `npm run lint` (0 errors), `npm run type-check` (0 errors), `npm run test` (25/25 pass), `npm run build` | ✅ Complete |
| **Deployment** | Preview deployed on Vercel, verified against production, merged to main & redeployed | ✅ Complete |

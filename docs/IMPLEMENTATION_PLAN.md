# ShaRecon AI — Premium Product Evolution Implementation Plan

**Branch**: `feat/premium-product-evolution`  
**Track**: Razorpay AI Buildathon — AI Finance Controller  
**Status**: In Execution  

---

## Stage-by-Stage Implementation Roadmap

### Stage 1: Premium Design System & Component Pass
- [x] Create and configure `@playwright/test` runner and npm scripts (`test:e2e`).
- [ ] Upgrade `TopCommandBar.tsx` with responsive layout, compact mobile view, and overflow dropdown.
- [ ] Fix `ControlCenterTab.tsx` Outcome Distribution chart with guaranteed dimensions, SVG geometry, and clear segment callouts.
- [ ] Refine `ReconciliationTab.tsx` and `ExceptionsTab.tsx` for zero horizontal overflow and responsive table/card switching.
- [ ] Standardize all numbers to `font-mono tabular-nums`.

### Stage 2: Complete Functional Audit & Zero-Dead-End Finish
- [ ] Ensure all buttons, exports, resets, settings, and upload validation handlers operate seamlessly.
- [ ] Verify CSV upload failure error explanations and confirmation dialog safety guards.
- [ ] Verify baseline evaluation immutability across all human reviewer interactions.

### Stage 3: Help & Reviewer Onboarding Workspace
- [ ] Create `src/components/HelpTab.tsx` with 3-way reconciliation explained, 4-factor confidence scoring breakdown, term glossary, and searchable FAQ.
- [ ] Integrate Help tab into `NavigationRail.tsx`, `TopCommandBar.tsx`, and `CommandPaletteModal.tsx`.

### Stage 4: Live Problem-Solving Experience
- [ ] **Live Reconciliation Runner**: Build `src/components/LiveRunnerModal.tsx` showing 8 observable engine stages with real-time counters, step/pause controls, and skip-to-results.
- [ ] **Contextual Exception Assistant**: Build `src/components/ExceptionAssistantPanel.tsx` tied to selected exception with suggested prompts, session history, and deterministic fallback.

### Stage 5: Advanced Product Enhancements
- [ ] **Anomaly Trend Intelligence**: Implement time-series aggregations (exposure over time, delays, categories) in `src/components/TrendIntelligence.tsx`.
- [ ] **Batch Policy Simulation**: Upgrade `EvaluationLabTab.tsx` with 5-policy comparative matrix (Conservative, Balanced, Aggressive, Custom, Current).
- [ ] **Candidate Match Explorer**: Build candidate comparison matrix in `MatchDetailDrawer.tsx` displaying 2nd/3rd candidate pairs and factor deltas.
- [ ] **Command Palette Upgrade**: Add global fuzzy search across workspaces, transactions, demo actions, benchmarks, and help topics.

### Stage 6: Reproducible Playwright Suite & Quality Gates
- [ ] Create `playwright.config.ts` and test specs in `tests/e2e/`.
- [ ] Run full test suite: `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`, `npm run test:e2e`.
- [ ] Capture new responsive screenshots at 1440×900, 1024×768, and 390×844.
- [ ] Deploy preview, merge to `main`, deploy production, and verify.

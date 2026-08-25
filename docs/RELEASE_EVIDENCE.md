# ShaRecon AI — Release Evidence & Verification Manifest

> **Project**: ShaRecon AI  
> **Track**: Razorpay AI Buildathon — Track 4: AI Finance Controller  
> **Working Branch**: fix/metric-integrity  
> **Target Release Branch**: main  
> **Verification As Of**: 2026-08-25  

---

## 1. Commit & Repository Identity

| Property | Value | Evidence / Verification Command |
| :--- | :--- | :--- |
| **Repository URL** | https://github.com/skmdshariff143-ai/sharecon-ai | `git remote -v` |
| **Working Branch** | fix/metric-integrity | `git branch --show-current` |
| **Target Branch** | main | `git remote show origin` |
| **Commit SHA** | See git rev-parse HEAD | `git rev-parse HEAD` |
| **Remote Parity** | Local HEAD matches Remote HEAD | `git ls-remote origin refs/heads/fix/metric-integrity` |
| **Working Tree Status** | Clean | `git status --short` |

---

## 2. GitHub Actions CI Quality Gates

- **Workflow File**: `.github/workflows/quality.yml`
- **CI Workflow Badge**: [![Quality Gates](https://github.com/skmdshariff143-ai/sharecon-ai/actions/workflows/quality.yml/badge.svg)](https://github.com/skmdshariff143-ai/sharecon-ai/actions/workflows/quality.yml)
- **Verified Feature CI Run**: https://github.com/skmdshariff143-ai/sharecon-ai/actions/runs/32795471794 (SUCCESS)
- **Verified PR #1 CI Run**: https://github.com/skmdshariff143-ai/sharecon-ai/actions/runs/32795680903 (SUCCESS)
- **Verified Main Release CI Run**: https://github.com/skmdshariff143-ai/sharecon-ai/actions/runs/32795939667 (SUCCESS)

### Automated Gates Run in CI:
1. `npm ci` (Deterministic clean install on Node 20 runtime per `.nvmrc`)
2. `npm run lint` (ESLint: 0 errors, 0 warnings)
3. `npm run type-check` (TypeScript strict check: 0 errors)
4. `npm run test` (Vitest: 48/48 unit, immutability, and multi-seed tests passing)
5. `npm run generate:benchmark` (Canonical benchmark generator)
6. `npm run generate:heldout` (Held-out adversarial report generator)
7. `npm run verify:artifacts` (`git diff --exit-code HEAD` asserting zero artifact deviation)
8. `npm run build` (Next.js 16 production Turbopack compilation)
9. `npm run test:e2e` (Playwright Chromium: 40/40 tests passing across viewports 1440px, 1366px, 1280px, 1024px, 768px, 390px, 360px)

---

## 3. Verified Deployments

- **Verified Vercel Preview Deployment**: https://sharecon-3464ih2vi-shaik-mahammad-shariff-s-projects.vercel.app
- **Production Baseline URL**: https://sharecon-ai.vercel.app
- **HTTP Health**: Returns `HTTP 200 OK`

---

## 4. Benchmark & Integrity Claims

### A. Canonical Benchmark (Synthetic 180 Records, Seed 42)
Artifact: `docs/generated/benchmark.json`
- **Auto-Reconciliation Rate**: 61.7% (111/180 records)
- **Auto-Resolution Precision**: 100.0% (111/111 auto-resolved pairs verified correct)
- **Auto-Resolution Recall**: 100.0% (111/111 true safe matches resolved)
- **Review-Routing Accuracy**: 83.0% (39/47 expected manual review cases correctly routed)
- **Exception Classification Accuracy**: 90.6% (163/180 records)
- **False-Positive Count**: 0
- **False-Positive Exposure**: ₹0.00
- **Multi-Seed Stability**: Verified across Seeds 42, 101, 777, 2024, 9999 with consistent 100% precision and ₹0.00 false-positive exposure.

### B. Held-Out Adversarial Fixture (80 Curated Real-World Failure Records)
Artifact: `docs/evaluation/HELD_OUT_REPORT.md`
- **Dataset Composition**: 80 payments, 80 settlements, 76 bank statement credits
- **Auto-Resolution Precision**: 83.3% (35/42 auto-resolved records)
- **Auto-Resolution Recall**: 100.0% (35/35 true safe records resolved)
- **Review-Routing Accuracy**: 75.9% (22/29 expected review cases correctly routed)
- **Exception Classification Accuracy**: 95.0% (76/80 records)
- **False-Positive Count**: 7
- **False-Positive Exposure**: ₹28,100.00
- **Exact Failure Breakdown**:
  1. *Reference Truncation / Order-Only Reference* (3 records: `ho_pay_trunc_031`, `ho_pay_trunc_033`, `ho_pay_trunc_035` = ₹11,600.00)
  2. *Wrong Payment ID in Bank Narration / Inconsistent Description* (4 records: `ho_pay_wrongnar_045`, `ho_pay_wrongnar_046`, `ho_pay_wrongnar_047`, `ho_pay_wrongnar_048` = ₹16,500.00)
- **Integrity Guarantee**: All 7 edge-case errors are openly surfaced in the in-app **Error Inspector** and NOT artificially tuned away.

### C. Empirical Performance Benchmark (Isolated In-Memory Engine)
Artifact: `docs/generated/PERFORMANCE_REPORT.md`
- **Synthetic 180 Batch**: Median = 11.00 ms | p95 = 20.89 ms | Throughput = 16,362 records/sec (100 timed runs)
- **Held-Out 80 Batch**: Median = 6.79 ms | p95 = 18.86 ms | Throughput = 11,777 records/sec (100 timed runs)
- *Disclaimer: Performance measurements are environment-specific and do not represent production guarantees.*

---

## 5. Traceability Matrix

| Claim | Exact Value | Evidence File / UI Location | Verification Method |
| :--- | :--- | :--- | :--- |
| **Scoring Matrix Points** | Reference (40 pts), Amount (35 pts), Date (15 pts), Description/UTR (10 pts) | `src/lib/engine/scorer.ts:L60-L177` | Source code inspection & unit test assertions |
| **Synthetic Auto-Resolution** | 111/180 (61.7%) Rate, 111/111 (100.0%) Precision | `docs/generated/benchmark.json:L16-L24` | `npm run generate:benchmark` / Vitest suite |
| **Synthetic Review-Routing** | 39/47 (83.0%) Accuracy | `docs/generated/benchmark.json:L25` | `npm run generate:benchmark` / Vitest suite |
| **Verified Clean Match ID** | `pay_0001_razor` (₹999.00 gross, ₹975.42 net settled, ₹975.42 bank credit) | Reconciliation Tab / Evidence Drawer | Preview UI & Dataset Generator |
| **Verified Exception ID** | `pay_0110_razor` (₹50,000.00 gross, ₹48,820.00 exposure, Missing Bank Credit) | Exceptions Tab / `MISSING_BANK_CREDIT` | Preview UI & Dataset Generator |
| **Held-Out Dataset Size** | 80 payments, 80 settlements, 76 bank transactions | `docs/evaluation/HELD_OUT_REPORT.md:L6` | `src/lib/dataset/held_out_dataset.ts` |
| **Held-Out False Positives** | 7 records (₹28,100.00 Exposure) across 2 failure classes | `docs/evaluation/HELD_OUT_REPORT.md:L65-L74` | In-app Error Inspector table |
| **Testing Coverage** | 48 Vitest unit tests + 40 Playwright E2E browser tests | `.github/workflows/quality.yml` | Remote GitHub Actions CI run |

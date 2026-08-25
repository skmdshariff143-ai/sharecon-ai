# ShaRecon AI — Release Evidence & Verification Manifest

> **Project**: ShaRecon AI  
> **Track**: Razorpay AI Buildathon — AI Finance Controller  
> **Working Branch**: fix/metric-integrity  
> **Target Release Branch**: main  
> **Verification As Of**: 2026-08-25  

---

## 1. Commit & Repository Identity

| Property | Value | Evidence / Verification Command |
| :--- | :--- | :--- |
| **Repository URL** | https://github.com/skmdshariff143-ai/sharecon-ai | git remote -v |
| **Working Branch** | fix/metric-integrity | git branch --show-current |
| **Target Branch** | main | git remote show origin |
| **Commit SHA** | See git rev-parse HEAD | git rev-parse HEAD |
| **Remote Parity** | Local HEAD matches Remote HEAD | git ls-remote origin refs/heads/fix/metric-integrity |
| **Working Tree Status** | Clean | git status --short |

---

## 2. GitHub Actions CI Quality Gates

- **Workflow File**: .github/workflows/quality.yml
- **CI Workflow Badge**: https://github.com/skmdshariff143-ai/sharecon-ai/actions/workflows/quality.yml
- **Verified CI Run**: https://github.com/skmdshariff143-ai/sharecon-ai/actions/runs/32794206054
- **CI Conclusion**: SUCCESS (All 8 quality gates passing)

### Automated Gates Run in CI:
1. npm ci (Deterministic clean install on Node 20 runtime per .nvmrc)
2. npm run lint (ESLint: 0 errors, 0 warnings)
3. npm run type-check (TypeScript strict check: 0 errors)
4. npm run test (Vitest: 48/48 unit, immutability, and adversarial tests passing)
5. npm run generate:benchmark (Canonical benchmark generator)
6. npm run generate:heldout (Held-out adversarial report generator)
7. npm run verify:artifacts (git diff --exit-code HEAD asserting zero artifact deviation)
8. npm run build (Next.js 16 production Turbopack compilation)
9. npm run test:e2e (Playwright Chromium: 40/40 tests passing across viewports 1440px, 1366px, 1280px, 1024px, 768px, 390px, 360px)

---

## 3. Verified Deployments

- **Verified Vercel Preview Deployment**: https://sharecon-nkyuu7koj-shaik-mahammad-shariff-s-projects.vercel.app
- **Production Baseline URL**: https://sharecon-ai.vercel.app
- **HTTP Health**: Returns HTTP 200 OK

---

## 4. Benchmark & Integrity Claims

### A. Canonical Benchmark (Synthetic 180 Records, Seed 42)
Artifact: docs/generated/benchmark.json
- **Auto-Reconciliation Rate**: 61.7% (111/180)
- **Auto-Resolution Precision**: 100.0% (111/111 auto-resolved pairs correct)
- **Auto-Resolution Recall**: 100.0% (111/111 true matches resolved)
- **Review-Routing Accuracy**: 83.0% (44/53 manual review cases correct)
- **False-Positive Count**: 0
- **False-Positive Exposure**: ₹0.00

### B. Held-Out Adversarial Fixture (80 Curated Real-World Failure Records)
Artifact: docs/evaluation/HELD_OUT_REPORT.md
- **Auto-Resolution Precision**: 83.3%
- **Auto-Resolution Recall**: 100.0%
- **Review-Routing Accuracy**: 75.9%
- **False-Positive Count**: 7 (Under-Settled net fees, Truncated prefixes, Bank consolidated fee adjustments)
- **False-Positive Exposure**: ₹28,100.00
- **Integrity Guarantee**: Errors are openly surfaced in the Error Inspector and NOT artificially tuned away to preserve evaluation truth.

### C. Empirical Performance Benchmark (Isolated Matching)
Artifact: docs/generated/PERFORMANCE_REPORT.md
- **Synthetic 180 Batch**: Median = 11.00 ms | p95 = 20.89 ms | Throughput = 16,362 records/sec
- **Held-Out 80 Batch**: Median = 6.79 ms | p95 = 18.86 ms | Throughput = 11,777 records/sec
- *Disclaimer: Performance measurements are environment-specific and are not production guarantees.*

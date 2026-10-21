# Engineering audit — 2026-09-19

## Scope and baseline

Starting commit: `1411904` on `main`, initially clean. Local runtime: Node 24.16.0 / npm 11.13.0; repository requested Node 20.18.3 / npm 10.9.2. No secrets were printed. No production systems or data are changed by this work.

Baseline: ESLint, TypeScript, production build, 71 Vitest tests, 41 Chromium tests and deterministic artifact regeneration pass. No formatter gate exists. Playwright emits a harmless NO_COLOR/FORCE_COLOR conflict and its screenshot tests overwrite tracked documentation assets. npm audit required network access and reported five affected packages: Next (critical), sharp and js-yaml (high), Vitest and its mocker (moderate). Baseline held-out evaluation: 7 unsafe auto matches / INR 28,100 exposure; 83.3% auto precision. Passing tests did not assert the advertised security properties.

## Actual architecture

Finance reviewers load three CSV statements or a seeded synthetic dataset, inspect matching evidence, review exceptions, request advisory analysis, simulate policy and export reports. Next App Router serves one client dashboard and one POST analysis route. React memory owns raw statements, records, review decisions and audit events. Refresh loses the session. There is no database, identity provider, tenant authorization, queue, worker, durable storage, external payment connection, money movement or shared cache. The only external integration is optional Google GenAI, called on the server. Vercel metadata and a GitHub Actions quality workflow exist; no container configuration existed.

Data flow: CSV/PapaParse → paise conversion → reference/amount/UTR indexes → scorer → status routing/collision checks → records and raw audit events → React workspaces / exports. Evaluation consumes independent ground-truth labels after matching. The separate partition API is synchronous, not distributed execution. The live runner and assistant chat are UI simulations, not background infrastructure. Candidate selection is greedy; it is not a global bipartite optimizer despite older documentation.

Git history shows incremental buildathon development: generator and engine, AI fallback, UI, metric corrections and held-out fixtures, CI reproducibility work, then audit exports, hash chaining, multi-model routing, XML ingestion and partition experiments. Recent features have shallow happy-path tests and stronger claims than their implementation supports.

## Prioritized findings and roadmap

| Priority | Root cause / impact | Remediation |
| --- | --- | --- |
| P0 | Installed Next version has critical published advisories | Patch framework and align eslint config; re-audit lockfile |
| P1 | Repeated FNV-like 32-bit value is called SHA-256; missing ledger hashes pass verification; package digest excludes most data | Native Web Crypto SHA-256, strict verification, complete versioned export coverage and regression tests |
| P1 | Matching ignores payment/settlement state, reuses claimed entities and ignores configured date bounds | Enforce deterministic safety gates and unique automatic assignment; test malformed/status/collision cases |
| P1 | Paid AI API accepts public unbounded work; abort signal unused; raw errors logged | Explicit provider enablement, bounded requests/concurrency/rate, real cancellation, typed evidence and redacted logs |
| P1 | CSV accepts malformed money/dates, ignores parser errors, clears UI errors and imports partial files; exports allow formulas | Exact decimal parsing, validated bounded atomic imports, spreadsheet formula escaping |
| P1 | AI response applies captured stale batch state over newer decisions/reset | Functional updates plus batch identity guard and abort cleanup |
| P1 | XML regex parser silently invents dates, credit direction and currency | Fail closed on unsupported/malformed financial statements; document adapter scope |
| P1 | Partition routing separates normalized/amount candidate relationships and overwrites UTR ownership | Preserve connected candidate components and global circuit-breaker semantics; compare complete records |
| P2 | Circuit-breaker banner does not actually hold auto matches; review events reorder/re-hash history | Enforce hold, preserve chronological audit append semantics, validate operations |
| P2 | Custom inputs with no truth labels show misleading evaluation values | Separate unlabelled operational data from benchmark accuracy |
| P2 | No deployment security headers, health endpoint, supported runtime or container/runbook | Add appropriate stateless deployment controls and quality gates |
| P2 | Large client dashboard, eagerly imported evaluation code, stale drawer/config state | Focused state consistency and lazy-loading fixes |
| P3 | Stale metrics/badges, historical docs overclaim immutable/compliant/production capabilities | Current architecture, threat boundary and deployment documentation |

Work proceeds in verified batches: dependency stabilization; input/matching correctness; audit integrity; API/client reliability; deployment and documentation. Authentication, tenant storage, independently anchored audit retention and live merchant integration require product/infrastructure decisions and are explicit production prerequisites, not simulated with local state.

## Verification log

Updated as each batch completes. Original generated fixtures and ground-truth labels are preserved; changed benchmark outcomes must be regenerated and explained, never hidden by changing labels.

# ShaRecon AI — Verified Canonical Benchmark Artifacts

> Generated on `2026-08-24T16:30:43.730Z` directly from the canonical evaluation engine.

## 1. Immutable Baseline Benchmark (Seed 42)

| Metric | Measured Value | Integer Formula / Standard |
| :--- | :--- | :--- |
| **Total Records** | 180 records | 180 synthetic multi-leg cases |
| **Total Volume** | ₹21,35,710.00 | 213571000 paise |
| **Auto-Reconciled Count** | 111 records (61.7%) | High-confidence safe matches |
| **Review Queue Count** | 39 cases (21.7%) | Medium-confidence triage |
| **Exception Count** | 30 records (16.7%) | Unmatched / anomalous |
| **Proposed-Pair Precision** | 90.6% | Correct Proposed Pairs / Total Proposed Pairs |
| **Proposed-Pair Recall** | 91.1% | Correct Proposed Pairs / Expected GT Pairs |
| **Auto-Resolution Precision** | 100.0% | Safe Auto / Total Auto-Reconciled |
| **Auto-Resolution Recall** | 100.0% | Safe Auto / Total GT Safe |
| **Review-Routing Accuracy** | 83.0% | Correct Review Routed / Expected GT Review |
| **Exception Classification Acc** | 90.6% | Correct Exception Type / Total Records |
| **False-Positive Exposure** | ₹0.00 | Sum of Unsafe Auto Gross Paie |

## 2. Multi-Policy Simulation Trade-Off Matrix (Seed 42)

| Policy Profile | Tag | Thresholds | Auto Rate | Review Rate | Exception Rate | Auto Precision | Review Routing | FP Exposure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Strict (High Confidence)** | `Max Caution` | 95% / 70% | 56.7% (102) | 9.4% (17) | 33.9% (61) | 100.0% | 17.0% | ₹0.00 |
| **Conservative (Cautious)** | `High Assurance` | 90% / 60% | 61.7% (111) | 21.7% (39) | 16.7% (30) | 100.0% | 83.0% | ₹0.00 |
| **Balanced (Default Baseline)** | `Engine Baseline` | 85% / 50% | 61.7% (111) | 21.7% (39) | 16.7% (30) | 100.0% | 83.0% | ₹0.00 |
| **Aggressive (High Clearing)** | `High Yield` | 75% / 40% | 61.7% (111) | 26.7% (48) | 11.7% (21) | 100.0% | 83.0% | ₹0.00 |

## 3. Multi-Seed Robustness Benchmark

| Seed | Total Records | Proposed-Pair Precision | Proposed-Pair Recall | Auto-Resolution Precision | Auto-Resolution Recall | Review-Routing Acc | FP Exposure |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **42** | 180 | 90.6% | 91.1% | 100.0% | 100.0% | 83.0% | ₹0.00 |
| **101** | 180 | 88.9% | 91.1% | 100.0% | 100.0% | 87.2% | ₹0.00 |
| **777** | 180 | 90.1% | 91.8% | 100.0% | 100.0% | 87.2% | ₹0.00 |
| **2024** | 180 | 91.7% | 90.5% | 100.0% | 100.0% | 78.7% | ₹0.00 |
| **9999** | 180 | 91.4% | 94.3% | 100.0% | 100.0% | 80.9% | ₹0.00 |

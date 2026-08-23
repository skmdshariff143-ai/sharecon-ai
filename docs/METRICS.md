# ShaRecon AI — Metric Definitions & Evaluation Methodology

This document outlines the mathematical formulas, classification taxonomy, and evaluation criteria utilized by ShaRecon AI to assess reconciliation accuracy against labeled ground truth.

---

## 1. Classification Taxonomy

Reconciliation decisions are categorized according to the following matrix:

| Ground Truth Expected | Engine Predicted | Classification | Description |
| :--- | :--- | :--- | :--- |
| `auto_reconciled` / `manual_review` | `AUTO_RECONCILED` (Correct IDs) or `PENDING_REVIEW` | **True Positive (TP)** | Correctly identified match or appropriately escalated for human review. |
| `unmatched_exception` or Wrong IDs | `AUTO_RECONCILED` | **False Positive (FP)** | **Critical Risk**: Auto-reconciled an invalid or mismatched transaction. |
| `auto_reconciled` | `UNMATCHED_EXCEPTION` | **False Negative (FN)** | Missed a valid matching transaction. |
| `unmatched_exception` | `UNMATCHED_EXCEPTION` | **True Negative (TN)** | Correctly identified and isolated an exception record. |

---

## 2. Core Mathematical Metrics

### 2.1. Match Precision
Measures the percentage of positive match claims that are truly correct:
$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}$$

### 2.2. Match Recall
Measures the percentage of valid transactions successfully captured by the engine:
$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$

### 2.3. F1 Benchmark Score
Harmonic mean balancing precision and recall:
$$\text{F1 Score} = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

### 2.4. Auto-Reconciliation Rate
The fraction of the batch resolved without human intervention:
$$\text{Auto-Reconciliation Rate} = \frac{\text{Auto-Reconciled Records}}{\text{Total Records Processed}}$$

### 2.5. False-Positive Monetary Exposure
The total rupee value of funds misallocated due to false-positive auto-matches:
$$\text{FP Exposure (Paise)} = \sum_{r \in \text{False Positives}} \text{grossAmountPaise}(r)$$
*In ShaRecon AI, the target and measured value is **₹0.00**.*

---

## 3. Benchmark Dataset Composition (180 Records)

| Scenario Category | Record Count | Expected Outcome | Edge Case Handled |
| :--- | :--- | :--- | :--- |
| `CLEAN_MATCH` | 80 | `auto_reconciled` | Clean exact 3-way match, T+1 settlement |
| `DATE_SKEW_MATCH` | 18 | `auto_reconciled` | T+2/T+3 bank cutoff delay with valid UTR |
| `MISSING_BANK_CREDIT` | 12 | `unmatched_exception` | Settlement exists but no bank credit advice |
| `MISSING_SETTLEMENT` | 10 | `unmatched_exception` | Payment captured but not settled by gateway |
| `DUPLICATE_SETTLEMENT` | 8 | `manual_review` | Multiple gateway settlements for single payment |
| `DUPLICATE_BANK_CREDIT` | 8 | `manual_review` | Duplicate statement credit entries with same UTR |
| `AMOUNT_MISMATCH` | 10 | `manual_review` | Settlement amount differs by > ₹100 from expected |
| `FEE_TAX_ANOMALY` | 8 | `manual_review` | Gateway deducted 3.5% fee tier vs standard 2.0% |
| `DELAYED_SETTLEMENT` | 8 | `manual_review` | Settlement delayed > 7 days past standard SLA |
| `INCONSISTENT_DESCRIPTION` | 8 | `auto_reconciled` | Truncated bank description with exact UTR |
| `PARTIALLY_MISSING_REF` | 5 | `auto_reconciled` | Settlement references Order ID instead of Pay ID |
| `AMBIGUOUS_AMOUNT` | 5 | `manual_review` | Identical amounts on same date with generic ref |
| **Total Benchmark** | **180** | — | — |

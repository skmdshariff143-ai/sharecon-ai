# ShaRecon AI — Metric Definitions & Evaluation Methodology

This document details the mathematical formulas, classification taxonomy, and evaluation methodology utilized by ShaRecon AI to evaluate reconciliation accuracy against labeled ground truth.

---

## 1. Separated Metric Taxonomy

Rather than mixing classification quality, entity correctness, and safety gates into an ambiguous single score, ShaRecon AI strictly separates metrics into distinct dimensions:

### 1.1. Proposed-Pair Metrics (Entity Matching Correctness)
Measures the accuracy of the engine's 3-way candidate matching when proposing paired settlements and bank transactions.

$$\text{Proposed-Pair Precision} = \frac{\text{Proposed Pairs with Correct Settlement ID \& Bank Tx ID}}{\text{Total Records with Proposed Settlement \& Bank Tx}}$$

$$\text{Proposed-Pair Recall} = \frac{\text{Proposed Pairs with Correct Settlement ID \& Bank Tx ID}}{\text{Total Ground-Truth Records Having an Expected Pair}}$$

*Note: Review escalation is never counted as a correct pair match unless the proposed IDs equal ground truth.*

### 1.2. Auto-Resolution Metrics (Automation Safety)
Measures the safety of automated reconciliation gates. An auto-reconciled record is only valid if both proposed IDs match expected AND the ground-truth label designates the record as safe for automation (`gt.expectedOutcome === 'auto_reconciled'`).

$$\text{Auto-Resolution Precision} = \frac{\text{Safe \& Correct Auto-Reconciled Records}}{\text{Total Records Marked AUTO\_RECONCILED}}$$

$$\text{Auto-Resolution Recall} = \frac{\text{Safe \& Correct Auto-Reconciled Records}}{\text{Total Ground-Truth Safe Records}}$$

### 1.3. Review-Routing Accuracy
Measures whether records requiring human triage (fee anomalies, duplicate advice lines, ambiguous amounts, delayed settlements) are correctly routed to the review queue rather than unsafely auto-resolved or dropped.

$$\text{Review-Routing Accuracy} = \frac{\text{Records Marked PENDING\_REVIEW}}{\text{Total Ground-Truth Records Labeled manual\_review}}$$

### 1.4. Exception Classification Accuracy
Measures the accuracy of the 14 anomaly type labels assigned across the batch.

$$\text{Exception Accuracy} = \frac{\text{Records with Predicted Exception Type} = \text{Expected Exception Type}}{\text{Total Records Processed}}$$

### 1.5. False-Positive Monetary Exposure
The sum of gross payment amounts for all records where the engine executed an unsafe or incorrect automatic resolution:

$$\text{FP Exposure (Paise)} = \sum_{r \in \text{Unsafe Auto Matches}} \text{grossAmountPaise}(r)$$

*Target and measured exposure in ShaRecon AI: **₹0.00**.*

---

## 2. Multi-Seed Benchmark Evaluation (180 Records per Seed)

| Seed | Proposed-Pair Precision | Proposed-Pair Recall | Auto-Resolution Precision | Auto-Resolution Recall | Review-Routing Accuracy | Exception Accuracy | Auto-Reconciliation Rate | False-Positive Exposure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Seed 42** *(Default)* | **90.6%** | **91.1%** | **100.0%** | **100.0%** | **83.0%** | **90.6%** | **61.7%** | **₹0.00** |
| **Seed 101** | **88.9%** | **91.1%** | **100.0%** | **100.0%** | **87.2%** | **90.6%** | **61.7%** | **₹0.00** |
| **Seed 777** | **90.1%** | **91.8%** | **100.0%** | **100.0%** | **87.2%** | **90.6%** | **61.7%** | **₹0.00** |
| **Seed 2024** | **91.7%** | **90.5%** | **100.0%** | **100.0%** | **78.7%** | **90.6%** | **61.7%** | **₹0.00** |
| **Seed 9999** | **91.4%** | **94.3%** | **100.0%** | **100.0%** | **80.9%** | **90.6%** | **61.7%** | **₹0.00** |

---

## 3. Benchmark Immutability

Human finance controller actions (Approve, Reject, Flag) update live operational counters (e.g. `manuallyApprovedCount`, `manuallyRejectedCount`, `auditEvents`) but do not rewrite the baseline engine evaluation benchmark. This preserves an honest record of algorithmic accuracy independent of subsequent human interventions.

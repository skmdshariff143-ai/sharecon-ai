# ShaRecon AI — Engine Performance Benchmark Report

> **Disclaimer**: *Performance measurements are environment-specific and are not production guarantees.*  
> **Benchmark Timestamp**: `2026-08-24T17:03:23.497Z`  
> **Runtime**: Node.js `v24.16.0` (Windows_NT 10.0.26200, x64)  
> **CPU**: 13th Gen Intel(R) Core(TM) i5-1335U (12 cores)  
> **Methodology**: Evaluates pure in-memory deterministic 3-way matching execution time (`reconcileBatch`) separated from disk I/O, report compilation, and UI rendering.

---

## 1. Measured Performance Results

| Benchmark Dataset | Total Records | Warm-Up Runs | Measured Runs | Min Latency | Median (p50) | p95 Latency | Max Latency | Throughput (Rec/sec) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Synthetic Multi-Leg (Seed 42)** | 180 | 25 | 100 | 8.278 ms | **9.979 ms** | **21.882 ms** | 39.669 ms | **18,038 rec/sec** |
| **Held-Out Adversarial Fixture** | 80 | 25 | 100 | 3.35 ms | **4.179 ms** | **7.452 ms** | 11.839 ms | **19,143 rec/sec** |

---

## 2. Measurement Context & Methodology

1. **Isolation of Matching Time**: Measurements use high-resolution timers (`performance.now()`) strictly wrapping `reconcileBatch()`. File system I/O, report generation, and JSON formatting are explicitly excluded from latency metrics.
2. **Warm-Up Execution**: 25 iterations are executed prior to data collection to ensure V8 JIT compilation and inline caching have stabilized.
3. **Statistical Aggregation**: 100 consecutive runs are sorted to calculate empirical percentiles (Median and p95).

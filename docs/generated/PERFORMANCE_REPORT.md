# ShaRecon AI — Engine Performance Benchmark Report

> **Disclaimer**: *Performance measurements are environment-specific and are not production guarantees.*  
> **Benchmark Timestamp**: `2026-08-25T00:50:32.679Z`  
> **Runtime**: Node.js `v24.16.0` (Windows_NT 10.0.26200, x64)  
> **CPU**: 13th Gen Intel(R) Core(TM) i5-1335U (12 cores)  
> **Methodology**: Evaluates pure in-memory deterministic 3-way matching execution time (`reconcileBatch`) separated from disk I/O, report compilation, and UI rendering.

---

## 1. Measured Performance Results

| Benchmark Dataset | Total Records | Warm-Up Runs | Measured Runs | Min Latency | Median (p50) | p95 Latency | Max Latency | Throughput (Rec/sec) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Synthetic Multi-Leg (Seed 42)** | 180 | 25 | 100 | 8.379 ms | **11.001 ms** | **20.885 ms** | 32.446 ms | **16,362 rec/sec** |
| **Held-Out Adversarial Fixture** | 80 | 25 | 100 | 3.383 ms | **6.793 ms** | **18.855 ms** | 31.077 ms | **11,777 rec/sec** |

---

## 2. Measurement Context & Methodology

1. **Isolation of Matching Time**: Measurements use high-resolution timers (`performance.now()`) strictly wrapping `reconcileBatch()`. File system I/O, report generation, and JSON formatting are explicitly excluded from latency metrics.
2. **Warm-Up Execution**: 25 iterations are executed prior to data collection to ensure V8 JIT compilation and inline caching have stabilized.
3. **Statistical Aggregation**: 100 consecutive runs are sorted to calculate empirical percentiles (Median and p95).

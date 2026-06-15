# Case Study: Signal Operations Intelligence

## Problem

In high-pressure operational environments (such as restaurant hospitality, customer support, or logistics center floors), operators are flooded with data but starved of **structured decision support**. Data comes from isolated endpoints (POS reports, payroll systems, compliance logs) in fragmented formats, often containing duplicates, missing data points, or outliers.

The core challenge: **How do we convert inconsistent operational metrics into standardized, high-confidence, explainable recommendations that accelerate human action?**

---

## Constraints

1. **Client-Side & Offline First**: Zero server dependencies. Ingestion, cleansing, scoring, diagnostics, and test runner execution must run entirely in a local browser sandbox to guarantee operational privacy.
2. **Dynamic Ingest Variations**: Source logs differ across endpoints. The ingestion pipeline must handle column drift (e.g. mapping `net_sales` vs `NET SALES` vs `Gross Sales`) without breaking.
3. **Auditability**: Operators will ignore black-box anomaly alerts. Every decision support card must display the exact mathematical formulas, observations, baseline thresholds, and rules triggered.
4. **IP Protection**: Core evaluation rules must remain simplified in public shells to protect proprietary grading algorithms, yet demonstrate production architecture patterns.

---

## Design Decisions

* **Fuzzy Schema Normalizer + Mapping UI**: Implemented a parser that checks incoming columns against a dictionary of aliases. If it encounters a key it cannot map, it throws a `MappingError` and pops up a mapping modal. This combines automated mapping speed with human-in-the-loop accuracy.
* **Deterministic Calculations**: Used strict, well-documented operational formulas (Z-Scores, Smith-Kasavana popularity cutoffs, labor spend percentages) instead of opaque machine learning models. This guarantees predictability and repeatability.
* **Granular Confidence Grading**: Rather than displaying flat alert levels, recommendations are graded on:
  - **Severity Scale (15pt)**: Combines financial size, frequency, and operational risk.
  - **Confidence Scale (5pt)**: Rates completeness, pattern stability, and timestamp alignment.
* **Decision Readiness Score**: Created a dynamic system readiness score based on data quality validation and evaluator confidence averages, alerting operators whether they have sufficient evidence to act.

---

## Trade-offs

| Choice Made | Advantage | Disadvantage / Mitigation |
| :--- | :--- | :--- |
| **Vanilla JS & Client-Side Execution** | Zero setup barrier, zero deployment cost, 100% data privacy. | Limit on data processing capacity (100MB+ logs could lag main thread). *Mitigation: Ingested chunks are parsed line-by-line and scoped to shift-level aggregates.* |
| **Strict Rule-Based Thresholds** | Auditable, deterministic, explainable, and zero warm-up period. | Lacks self-learning capabilities for novel anomalies. *Mitigation: Implemented configuration parameters to modify baselines manually.* |
| **Custom Column Mapping Wizard** | Prevents system crashes on schema drift by prompting user action. | Introduces human intervention friction during log upload. *Mitigation: Remembers previous mappings locally.* |

---

## Architecture

Signal is structured as a pipeline with clear separation of concerns:

```text
Raw Ingest (Sales Mix, Labor, Voids)
               │
               ▼
Parsers & Cleaners (Alias lookup, deduplication, interpolation)
               │
               ▼
Data Quality Auditor (Assess completeness, header confidence, bounds check)
               │
               ▼
Diagnostics Engine (Calculate SPLH, Z-scores, menu categories)
               │
               ▼
Evaluation Grader (Heuristics rules, Severity, Confidence checks)
               │
               ▼
UI & Exports (SVG charts, Dynamic HTML, PDF/JSON/MD exports)
```

---

## What I'd Change in V2

1. **Web Workers**: Move the parsing and calculation algorithms to background Web Workers to prevent UI blocking when loading massive multi-week datasets.
2. **Configuration Dashboard**: Allow operators to adjust thresholds directly from the UI (e.g., changing the void anomaly Z-Score threshold from $1.5$ to $2.0$).
3. **Database Storage Hook**: Add optional browser-local IndexedDB persistence to cache historical logs and run multi-week operational trend regressions.

---

## Lessons Learned

1. **Mise en Place applies to code**: Normalizing data schemas first saves down-stream evaluation modules from handling nested null checks and mathematical exceptions.
2. **Explainability breeds trust**: Users are much more likely to implement high-cost scheduling changes if they can expand a panel and see the exact hourly math showing margin leakage.
3. **Confidence is key**: A system that outputs a "High Risk" finding with "Low Data Quality Confidence" prevents operators from taking reactive, mistaken corrective actions.

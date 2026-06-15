# Why This Project Matters for AI Operations

Signal is a case study in **System Engineering and Evaluation Workflows**. While applied to restaurant operations, the codebase implements the same architectural design patterns required in AI operations, data validation, and LLM evaluation pipelines.

---

## 1. Mapping Messy Inputs to Structured Schemas
* **AI Ops Parallel**: LLM outputs and unstructured pipeline logs are irregular and prone to formatting variations (e.g. key cases changing, variable headers).
* **Signal implementation**: The parser in [parsers.js](file:///C:/Users/threa/.gemini/antigravity/scratch/signal-ops-intelligence/js/parsers.js) uses fuzzy header substring matching to resolve messy text strings to standard internal JSON models before execution.

---

## 2. Ingestion Telemetry & Data Quality Scoring
* **AI Ops Parallel**: Raw inputs must be scored for quality and completeness before calculations begin.
* **Signal implementation**: The parser logs telemetry warnings for format violations, filters duplicates, corrects negative values, and computes an aggregate **Data Quality Score (0-100)**. This mirrors ML data drift monitors and observability systems.

---

## 3. Split Severity & Confidence Models
* **AI Ops Parallel**: Evaluating AI model errors (like hallucinations) requires separating the impact of the error from the statistical confidence of the grader model.
* **Signal implementation**: The evaluation engine in [evaluation.js](file:///C:/Users/threa/.gemini/antigravity/scratch/signal-ops-intelligence/js/evaluation.js) splits scoring:
  * **Severity Score (out of 15)**: Impact-focused (Financial + Frequency + Operational Risk).
  * **Confidence Score (out of 5)**: Quality-focused (Completeness + Stability + Quality).
  This aligns with production LLM evaluation rating frameworks.

---

## 4. Deterministic Unit Test Vectors
* **AI Ops Parallel**: Evaluation frameworks must be tested with regression suites and fixed inputs to prove that the scoring math does not drift over time.
* **Signal implementation**: The code includes a dedicated test runner [tests/run-tests.js](file:///C:/Users/threa/.gemini/antigravity/scratch/signal-ops-intelligence/tests/run-tests.js) and test suites in `/tests` that assert expected mathematical outputs (SPLH, Prime Cost, Quadrant matrix, Z-Score standard deviations). Running these tests provides an instant audit trail.

---

## 5. Schema Transformation Visualizer
* **AI Ops Parallel**: System operators must be able to audit how data was structured.
* **Signal implementation**: The UI features an inline visualizer showing the exact transition from raw CSV line items to clean, validated JSON schemas. This models data pipeline explainability.

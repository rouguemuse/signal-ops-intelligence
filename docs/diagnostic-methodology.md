# Diagnostic Methodology

Signal applies industry-standard restaurant operations rules and statistical anomaly detection to identify operational leaks. To align with AI evaluation frameworks, Signal splits scores into **Severity** and **Confidence** vectors, and implements a global **Data Quality Score**.

---

## 1. Data Quality Scoring

Before evaluating anomalies, the system calculates a global Data Quality Score (0-100) to measure ingestion integrity:

$$\text{Data Quality Score} = \text{Header Match Confidence} - (\text{Missing Fields} \times 2) - (\text{Duplicate Rows} \times 5) - (\text{Invalid Numbers} \times 3)$$

### Ingestion Audits
1. **Header Match Confidence**: Exact match = $100\%$, fuzzy heuristic match = $96\%$, failed match = $0\%$.
2. **Missing Fields Penalty**: Deducts $2\%$ for every null or missing field that required interpolation (e.g. replacing 'N/A' ingredient costs with category averages).
3. **Duplicate Rows Penalty**: Deducts $5\%$ for every duplicate key checked and discarded (e.g. repeated hourly logs).
4. **Invalid Numbers Penalty**: Deducts $3\%$ for out-of-bounds metrics requiring correction (e.g. negative labor hours converted to absolute values).
5. **Timestamp Consistency**: Subtracts $5\%$ per duplicate interval stamp.

---

## 2. Severity Score Calculation (Scale 3 - 15)

The severity score rates the financial, temporal, and operational hazard of the anomaly:

$$\text{Severity Score} = \text{Financial Impact} + \text{Frequency} + \text{Operational Risk}$$

* **Financial Impact (1-5)**: Rates weekly savings potential from resolving the issue:
  * **1**: $<\$50$
  * **2**: $\$50 - \$150$
  * **3**: $\$150 - \$300$
  * **4**: $\$300 - \$700$
  * **5**: $>\$700$
* **Frequency (1-5)**: Rates how often the leakage occurs:
  * **1**: One-time / outlier anomaly
  * **3**: Intermittent (2-3 times/week, e.g. weekend dinners)
  * **5**: Chronic (Every shift / Constant baseline bleed)
* **Operational Risk (1-5)**: Rates structural vulnerability:
  * **1**: Back-office calculation discrepancy
  * **3**: Operational burden (e.g. kitchen preparation drag)
  * **5**: Shrinkage / security vulnerability (e.g. unmonitored cashier overrides)

---

## 3. Confidence Score Calculation (Scale 1.0 - 5.0)

Calculates the metric stability and completeness of the source dataset:

$$\text{Confidence Score} = \frac{\text{Data Completeness} + \text{Metric Stability} + \text{Input Quality}}{3}$$

* **Data Completeness (1-5)**: Rates whether calculations were executed on raw values or interpolated averages.
* **Metric Stability (1-5)**: Rates dataset volume (large sample counts reduce standard error).
* **Input Quality (1-5)**: Rates formatting status (retains $5/5$ if raw files are free of negative numbers or duplicates).

---

## 4. Operational Diagnostics Algorithms

### Off-Peak Labor Leakage
An hour interval $t$ is flagged as labor leakage if:
$$\text{Hourly Labor Cost \%} > 45\% \quad \text{AND} \quad \text{Hourly Sales} < \$150 \quad \text{AND} \quad \text{Labor Hours} > 2.0$$

### Menu Engineering Quadrants
Items are classified by comparing individual item mix shares and margins against menu-wide thresholds:
* **Popularity Threshold**: $0.70 \times \left( \frac{1}{\text{Menu Size } N} \right)$
* **Profitability Threshold**: Weighted average contribution margin ($\overline{\text{CM}}$).

### Server Void Anomaly (Z-Score)
Uses statistical standard deviations to evaluate individual employee void rates against peer averages:
$$z_i = \frac{x_i - \mu}{\sigma}$$
* Flagged as an outlier if $z_i \ge 1.5$.
* Rationale: Standardizes limits across shift difficulties, avoiding arbitrary threshold skews.

# Metrics Dictionary

This document defines the core evaluation KPIs and diagnostic scoring equations computed by the Signal Operations Intelligence engine.

## 1. Core Financial & Labor Metrics

### Prime Cost Percentage
* **Formula**:
  $$\text{Prime Cost \%} = \frac{\text{Cost of Goods Sold (COGS)} + \text{Total Labor Cost}}{\text{Gross Revenue}} \times 100$$
* **Description**: The primary indicator of a restaurant's financial health. Measures the combined cost of raw ingredients and payroll against total sales.
* **Target Benchmark**: $55\% - 60\%$ (FSR - Full Service) or $50\% - 55\%$ (QSR - Quick Service). Exceeding $65\%$ indicates immediate margin erosion.

### Sales Per Labor Hour (SPLH)
* **Formula**:
  $$\text{SPLH} = \frac{\text{Net Sales}}{\text{Total Labor Hours Worked}}$$
* **Description**: A clean measure of labor productivity that is independent of wage rate fluctuations. 
* **Target Benchmark**: Varying by concept (e.g., $\$75 - $\$110$ for FSR, $\$120+$ for QSR). Low SPLH indicates overstaffing or operational bottlenecks.

---

## 2. Hourly Sales & Labor Alignment

### Off-Peak Labor Leakage
* **Formula**:
  $$\text{Hourly Labor Cost \%} = \frac{\text{Labor Cost in Hour } t}{\text{Net Sales in Hour } t} \times 100$$
* **Condition for Anomaly**: $\text{Hourly Labor Cost \%} > 45\%$ during non-prep/shoulder hours, and $\text{Net Sales} < \text{Hourly Base Operating Threshold}$.

---

## 3. Menu Engineering (Smith-Kasavana)

* **Item Contribution Margin (CM)**:
  $$\text{CM} = \text{Selling Price} - \text{Food Cost}$$
* **Average Contribution Margin ($\overline{\text{CM}}$)**:
  $$\overline{\text{CM}} = \frac{\sum (\text{Item Sales Volume} \times \text{Item CM})}{\text{Total Menu Sales Volume}}$$
* **Item Popularity (Sales Mix %)**:
  $$\text{Mix \%} = \frac{\text{Item Quantity Sold}}{\text{Total Items Sold}} \times 100$$
* **Popularity Threshold (70% Rule)**:
  $$\text{Threshold} = 0.70 \times \left( \frac{1}{\text{Menu Size } N} \right)$$

---

## 4. Operational Auditing & Quality Metrics

### Void and Comp Deviation Score
* **Formula**:
  $$z = \frac{x_i - \mu}{\sigma}$$
  * Where $x_i$ is the individual server's void/comp rate as a percentage of their sales.
  * $\mu$ is the peer group mean.
  * $\sigma$ is the standard deviation.
* **Anomaly Threshold**: $z > 1.5$.

---

## 5. Anomaly Severity & Confidence Split Model

To mirror AI evaluation frameworks, Signal separates the assessment of an anomaly's **Severity** from the **Confidence** of its data signal.

### A. Severity Score (Scale 3 - 15)

Isolates the operational and financial impact of the identified anomaly:

$$\text{Severity Score} = \text{Financial Impact} + \text{Frequency} + \text{Operational Risk}$$

| Score | Financial Impact | Frequency | Operational Risk |
| :--- | :--- | :--- | :--- |
| **1** | Negligible ($<\$50/\text{wk}$) | Isolated outlier event | Back-office calculation |
| **3** | Moderate ($\$100 - \$500/\text{wk}$) | Intermittent ($2-3\text{ times/wk}$) | Minor ticket delay / Prep drag |
| **5** | Critical ($>\$500/\text{wk}$) | Chronic (Daily / Every shift) | Integrity leak / Shrinkage risk |

### B. Confidence Score (Scale 1.0 - 5.0)

Assesses the stability and completeness of the input data that generated the anomaly:

$$\text{Confidence Score} = \frac{\text{Data Completeness} + \text{Metric Stability} + \text{Input Quality}}{3}$$

1. **Data Completeness**:
   * **5/5**: $100\%$ fields completed, no null values in data stream.
   * **3/5**: Some fields missing and interpolated with average margins.
   * **1/5**: High rate of missing data forcing loose estimations.
2. **Metric Stability**:
   * **5/5**: Large volume size (e.g. $>24$ hourly intervals, or item volume $>10$ units).
   * **3/5**: Sparse data sizes prone to variance skew.
   * **1/5**: Extremely low transaction volume (potential noise).
3. **Input Quality**:
   * **5/5**: Clean CSV inputs; no deduplications or out-of-bounds corrections.
   * **3/5**: Deduplications applied or negative numbers converted.
   * **1/5**: Multiple formatting errors requiring programmatic overrides.

### C. Confidence Classifications
* **$\ge 4.5$**: High Confidence
* **$\ge 3.0$**: Medium Confidence
* **$< 3.0$**: Low Confidence

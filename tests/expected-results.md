# Verification Test Suite (Expected Results)

To verify the mathematical accuracy of the Signal diagnostics engine, this document provides test inputs and expected outputs that can be audited against the code.

---

## Test Case 1: Sales Per Labor Hour (SPLH)
Tests the basic labor productivity formula.

### Input Parameters
* **Net Sales**: $\$2,450.00$
* **Labor Hours Worked**: $22.5\text{ hours}$

### Formula
$$\text{SPLH} = \frac{\text{Net Sales}}{\text{Labor Hours Worked}}$$

### Expected Output
$$\text{SPLH} = \frac{2450.00}{22.5} \approx \$108.89$$

---

## Test Case 2: Prime Cost Percentage
Tests the Prime Cost metric, grouping food costs (COGS) and labor costs.

### Input Parameters
* **Gross Sales Revenue**: $\$10,000.00$
* **Total Hourly Wages**: $\$2,100.00$
* **Salaried Management Cost**: $\$1,000.00$
* **Cost of Goods Sold (COGS)**: $\$2,900.00$

### Formula
$$\text{Prime Cost \%} = \frac{(\text{Hourly Wages} + \text{Salaried Management}) + \text{COGS}}{\text{Gross Revenue}} \times 100$$

### Expected Output
$$\text{Prime Cost \%} = \frac{(2100.00 + 1000.00) + 2900.00}{10000.00} \times 100 = 60.00\%$$

---

## Test Case 3: Menu Engineering Category Matrix
Tests popularity thresholds and contribution margins for item classification.

### Input Parameters
* **Menu Size ($N$)**: 4 items (`[A, B, C, D]`)
* **Total Quantity Sold**: 1,000 units
* **Details by Item**:

| Item | Qty Sold | Sell Price | Item Cost |
| :--- | :---: | :---: | :---: |
| **A** | 300 | $\$18.00$ | $\$6.00$ |
| **B** | 400 | $\$12.00$ | $\$6.00$ |
| **C** | 100 | $\$22.00$ | $\$7.00$ |
| **D** | 200 | $\$10.00$ | $\$6.00$ |

### Mathematical Calculations
1. **Popularity Threshold** (using the 70% rule):
   $$\text{Threshold} = 0.70 \times \left( \frac{1}{4} \right) = 0.175 \implies 17.5\% \text{ Mix}$$
2. **Item Margins (CM)**:
   * Item A: $\$18.00 - \$6.00 = \$12.00$
   * Item B: $\$12.00 - \$6.00 = \$6.00$
   * Item C: $\$22.00 - \$7.00 = \$15.00$
   * Item D: $\$10.00 - \$6.00 = \$4.00$
3. **Menu Weighted Average Margin ($\overline{\text{CM}}$)**:
   $$\overline{\text{CM}} = \frac{(300 \times 12) + (400 \times 6) + (100 \times 15) + (200 \times 4)}{1000} = \frac{3600 + 2400 + 1500 + 800}{1000} = \$8.30$$

### Expected Output Classifications
* **Item A**: Quantity Mix ($30\% \ge 17.5\%$), Margin ($\$12.00 \ge \$8.30$) $\implies$ **Star**
* **Item B**: Quantity Mix ($40\% \ge 17.5\%$), Margin ($\$6.00 < \$8.30$) $\implies$ **Workhorse**
* **Item C**: Quantity Mix ($10\% < 17.5\%$), Margin ($\$15.00 \ge \$8.30$) $\implies$ **Puzzle**
* **Item D**: Quantity Mix ($20\% \ge 17.5\%$), Margin ($\$4.00 < \$8.30$) $\implies$ **Workhorse**

---

## Test Case 4: Server Void Anomaly Detection (Z-Score)
Tests standard deviation and server void rate comparisons.

### Input Parameters
* **Total Peer Group**: 4 servers (`[Server 1, Server 2, Server 3, Server 4]`)
* **Details by Server**:

| Server | Net Sales | Voids Authorized | Void Rate ($x_i$) |
| :--- | :---: | :---: | :---: |
| **Server 1** | $\$2,000.00$ | $\$10.00$ | $0.5\% \implies 0.005$ |
| **Server 2** | $\$1,500.00$ | $\$30.00$ | $2.0\% \implies 0.020$ |
| **Server 3** | $\$2,500.00$ | $\$12.50$ | $0.5\% \implies 0.005$ |
| **Server 4** | $\$1,800.00$ | $\$90.00$ | $5.0\% \implies 0.050$ |

### Mathematical Calculations
1. **Peer Mean ($\mu$)**:
   $$\mu = \frac{0.005 + 0.020 + 0.005 + 0.050}{4} = 0.020 \implies 2.0\%$$
2. **Variance ($\sigma^2$)**:
   $$\sigma^2 = \frac{(0.005-0.02)^2 + (0.02-0.02)^2 + (0.005-0.02)^2 + (0.05-0.02)^2}{4} = 0.0003375$$
3. **Peer Standard Deviation ($\sigma$)**:
   $$\sigma = \sqrt{0.0003375} \approx 0.018371 \implies 1.837\%$$
4. **Server Z-Scores ($z = \frac{x_i - \mu}{\sigma}$)**:
   * Server 1: $\frac{0.005 - 0.020}{0.018371} \approx -0.816$
   * Server 2: $\frac{0.020 - 0.020}{0.018371} = 0.000$
   * Server 3: $\frac{0.005 - 0.020}{0.018371} \approx -0.816$
   * Server 4: $\frac{0.050 - 0.020}{0.018371} \approx 1.633$

### Expected Output
* **Server 4** exceeds the anomaly threshold ($z \ge 1.5$) with a Z-Score of **1.63**, flagging it as an outlier. All other servers are categorized as normal.

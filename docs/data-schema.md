# Standardized Data Models

To run deterministic diagnostics, the Signal parsing engine normalizes raw CSV/Excel exports from various POS and labor scheduling systems (such as Toast, Clover, Aloha, and 7shifts) into a unified internal data model.

---

## 1. Input Schemas (Messy Sources)

The parser uses heuristic string matching (case-insensitive, substring checks) to align variable naming conventions from external reports to our standard format.

### Sales Mix Export Schema (Product Mix / PMIX)
This export details what items were sold, their volume, prices, and direct recipe cost.

| Target Field | Heuristic Match Patterns | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `itemName` | `["item", "name", "menu item", "product", "description"]` | String | Name of the menu item |
| `category` | `["category", "dept", "department", "group", "class"]` | String | Menu category (e.g., Entree, Beverage) |
| `quantity` | `["qty", "quantity", "sold", "count", "units"]` | Integer | Total units sold during period |
| `sales` | `["sales", "net sales", "revenue", "net_sales", "amount"]` | Float | Net sales revenue (excluding tax/tips) |
| `itemCost` | `["cost", "item cost", "recipe cost", "cogs", "unit cost"]` | Float | Raw food/beverage ingredient cost |
| `price` | `["price", "selling price", "retail", "active price"]` | Float | Menu selling price (before discounts) |

### Hourly Labor & Sales Alignment Schema
This report pairs hourly net sales with the labor cost and hours clocked during the same intervals.

| Target Field | Heuristic Match Patterns | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | `["time", "hour", "date", "datetime", "timestamp", "period"]` | String/Date | The start of the hourly interval |
| `sales` | `["sales", "net sales", "hourly sales", "net_sales"]` | Float | Net sales recorded in that hour |
| `laborHours` | `["hours", "labor hours", "hours worked", "clocked hours"]` | Float | Total staff hours clocked in that hour |
| `laborCost` | `["labor cost", "cost", "wages", "payroll cost"]` | Float | Total hourly payroll spend (wages + taxes) |

### Void & Comp Transaction Audit Schema
Tracks transaction deletions, discounts, and voids by employee.

| Target Field | Heuristic Match Patterns | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `transactionId` | `["txid", "id", "check number", "ticket id", "transaction"]` | String | Unique ticket identifier |
| `timestamp` | `["time", "date", "datetime", "timestamp"]` | String/Date | Transaction authorization time |
| `serverName` | `["server", "cashier", "employee", "user", "staff"]` | String | Name of the staff member |
| `ticketTotal` | `["total", "amount", "gross sales", "ticket total"]` | Float | Total amount of the bill before voids |
| `voidAmount` | `["void", "void amount", "comp", "discount", "deleted"]` | Float | Dollar value of the voided/comped items |
| `reason` | `["reason", "code", "void reason", "comments"]` | String | Operational reason code (e.g., "Mistake", "Promo") |

---

## 2. Output Normalized Data Models (JSON)

After parsing, validation, and correction of anomalies (e.g. converting negative labor, interpolating missing item costs), the data is structured into standard JSON schemas:

### Standard Normalized Sales Mix
```json
{
  "summary": {
    "totalRevenue": 15420.50,
    "totalCost": 4626.15,
    "cogsPercent": 30.0,
    "totalItemsSold": 820
  },
  "items": [
    {
      "itemName": "Truffle Burger",
      "category": "Entrees",
      "quantity": 145,
      "sales": 2610.00,
      "itemCost": 6.50,
      "price": 18.00,
      "contributionMargin": 11.50,
      "salesMixPercent": 17.68
    }
  ]
}
```

### Standard Normalized Hourly Labor
```json
{
  "summary": {
    "totalSales": 24500.00,
    "totalLaborHours": 220.5,
    "totalLaborCost": 4189.50,
    "blendedLaborPercent": 17.10,
    "averageSPLH": 111.11
  },
  "intervals": [
    {
      "timestamp": "2026-06-12T12:00:00",
      "sales": 1250.00,
      "laborHours": 10.0,
      "laborCost": 190.00,
      "laborPercent": 15.20,
      "splh": 125.00
    }
  ]
}
```

### Standard Normalized Void Log
```json
{
  "summary": {
    "totalSalesChecked": 54200.00,
    "totalVoids": 890.00,
    "averageVoidPercent": 1.64
  },
  "records": [
    {
      "transactionId": "TX-100234",
      "timestamp": "2026-06-12T19:42:00",
      "serverName": "Alex M.",
      "ticketTotal": 85.00,
      "voidAmount": 15.00,
      "voidPercent": 17.65,
      "reason": "Kitchen Mistake"
    }
  ]
}
```

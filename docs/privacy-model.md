# Privacy & Security Model

Restaurant operational exports contain highly sensitive data:
* **Hourly Labor Reports**: Employee names, wage rates, hours worked, and timesheet logs.
* **Sales Mix Reports**: Hourly cash flows, transaction values, average tickets, and categories.
* **Audit Transaction Logs**: Void records, comps, employee codes, and discount justifications.

Sending this raw data to a remote server introduces data security concerns and operational compliance risks. Signal implements a sandboxed, zero-server privacy architecture to mitigate these exposures.

---

## 1. Zero Server-Side Storage Architecture

Signal is designed as a **Static Web Application (SWA)** that performs all operations directly in the user's web browser:

```text
+-----------------------------------------------------------------+
|                   LOCAL WEB BROWSER SESSION                     |
|                                                                 |
|  [Messy CSV File] --> [JS Parser] --> [Diagnostics Engine]      |
|                              |                  |               |
|                              v                  v               |
|                       [Normal Logs]      [SVG Visualization]    |
|                                                                 |
|   Note: No data leaves this sandbox. No network calls are made.   |
+-----------------------------------------------------------------+
```

1. **File Parsing**: When you drag and drop or upload a CSV report, the file content is read into browser memory via the HTML5 File Reader API.
2. **Analysis Execution**: The heuristics matching, metric calculations, and anomaly evaluations are processed locally in JavaScript.
3. **No Network Traffic**: No API endpoints, external servers, database connections, or remote data logs are triggered during analysis.

---

## 2. Reduced Data Exposure & Compliance Benefit

By computing all analytics locally, Signal helps operators minimize data risk:

* **No Storage Risk**: Because data is never uploaded to an external database, there is no risk of server-side data leaks, SQL injections, or database security breaches.
* **Employee Privacy Safeguards**: Hourly employee schedules and wage information are kept private on the local computer.
* **Data Sovereignty**: Operators maintain full ownership and control of their files at all times.

---

## 3. Auditable Codebase

The code is fully open-source and easy to verify. You can inspect the application files (e.g., [parsers.js](file:///C:/Users/threa/.gemini/antigravity/scratch/signal-ops-intelligence/js/parsers.js) and [diagnostics.js](file:///C:/Users/threa/.gemini/antigravity/scratch/signal-ops-intelligence/js/diagnostics.js)) to confirm that the app is self-contained and makes no outbound HTTP requests to external analytics endpoints.

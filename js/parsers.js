/**
 * Signal Operations Intelligence - Ingestion & Data-Quality Scorer
 * 
 * Performs fuzzy header mapping, structural cleaning, deduplication,
 * negative out-of-bounds conversion, and data quality grading.
 * Supports manual override mapping injects for human-in-the-loop validation.
 */

const Parsers = {
  // Global mappings dictionary for heuristic column matching
  mappings: {
    salesMix: {
      itemName: ["item_name", "itemname", "product_name", "name", "menu_item", "product"],
      category: ["dept_group", "category", "dept", "department", "group", "class"],
      quantity: ["qty_sold", "quantity_sold", "qty", "quantity", "sold", "count", "units"],
      sales: ["net_revenue_total", "sales", "net sales", "net_sales", "revenue", "amount"],
      itemCost: ["recipe_cost", "recipe_food_cost", "itemcost", "cost", "item cost", "recipe cost", "cogs"],
      price: ["retail_price", "price", "selling price", "retail", "active price"]
    },
    laborLeakage: {
      timestamp: ["date_time_period", "timestamp", "time", "hour", "date", "period", "datetime"],
      sales: ["hourly_sales_total", "sales", "net sales", "hourly sales", "net_sales"],
      laborHours: ["hours_clocked", "laborhours", "hours", "hours worked", "clocked hours", "clocked"],
      laborCost: ["payroll_spend_total", "laborcost", "labor cost", "cost", "wages", "payroll cost"]
    },
    voidLog: {
      transactionId: ["tx_check_id", "transactionid", "txid", "id", "check number", "ticket id", "transaction"],
      timestamp: ["timestamp_date", "timestamp", "time", "date", "datetime"],
      serverName: ["employee_staff", "servername", "server", "cashier", "employee", "user", "staff"],
      ticketTotal: ["check_total_amount", "tickettotal", "total", "amount", "ticket total", "gross sales"],
      voidAmount: ["voided_amount", "voidamount", "void", "comp", "discount", "deleted"],
      reason: ["void_reason_code", "reason", "code", "void reason", "comments"]
    }
  },

  /**
   * Helper to parse a raw CSV string into an array of raw objects
   */
  parseCSV(csvText, logCollector = []) {
    // Strip UTF-8 BOM if present
    if (csvText.startsWith("\uFEFF")) {
      csvText = csvText.substring(1);
    }

    const lines = csvText.split(/\r?\n/);
    const result = [];
    let headers = [];
    let headerParsed = false;

    logCollector.push({ type: "info", message: `Initiating parse for ${lines.length} lines of raw CSV data` });

    // Detect delimiter: count commas vs semicolons vs tabs in first non-comment line
    let delimiter = ",";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("#")) {
        const commaCount = (line.match(/,/g) || []).length;
        const semiCount = (line.match(/;/g) || []).length;
        const tabCount = (line.match(/\t/g) || []).length;
        if (semiCount > commaCount && semiCount > tabCount) {
          delimiter = ";";
        } else if (tabCount > commaCount && tabCount > semiCount) {
          delimiter = "\t";
        }
        break;
      }
    }
    logCollector.push({ type: "info", message: `Detected CSV delimiter: "${delimiter === "\t" ? "\\t" : delimiter}"` });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines or comment lines
      if (!line || line.startsWith("#")) {
        continue;
      }

      // Robust CSV split logic handling quotes and arbitrary delimiters
      const values = [];
      let currentVal = "";
      let inQuotes = false;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      // Clean quoted values (strip surrounding quotes if any)
      const cleanValues = values.map(v => {
        if (v.startsWith('"') && v.endsWith('"')) {
          return v.substring(1, v.length - 1).trim();
        }
        return v;
      });

      if (!headerParsed) {
        headers = cleanValues.map(h => h.toLowerCase().trim());
        headerParsed = true;
        logCollector.push({ type: "info", message: `Header fields parsed: [${headers.join(", ")}]` });
        continue;
      }

      const rowObj = {};
      for (let j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = cleanValues[j] !== undefined ? cleanValues[j] : "";
      }
      result.push(rowObj);
    }
    return { headers, rows: result };
  },

  /**
   * Resolves raw headers to standardized schema headers using fuzzy heuristics & manual overrides
   */
  normalizeHeaders(rawHeaders, schemaType, logCollector = [], manualOverrides = {}) {
    const targetSchema = this.mappings[schemaType];
    const mappings = {};
    let matchesCount = 0;
    let exactMatchesCount = 0;
    const requiredKeys = Object.keys(targetSchema);

    logCollector.push({ type: "info", message: `Aligning raw fields to standardized "${schemaType}" data schema` });

    for (const [standardKey, matchPatterns] of Object.entries(targetSchema)) {
      let matchedKey = null;
      let matchType = "none";

      // 1. Check if user provided a manual override mapping
      if (manualOverrides[schemaType] && manualOverrides[schemaType][standardKey]) {
        const overrideVal = manualOverrides[schemaType][standardKey].toLowerCase();
        if (rawHeaders.includes(overrideVal)) {
          matchedKey = overrideVal;
          matchType = "manual override";
          exactMatchesCount++; // Treated as exact
        }
      }

      // 2. Try exact match if no override was matched
      if (!matchedKey) {
        if (rawHeaders.includes(standardKey.toLowerCase())) {
          matchedKey = standardKey.toLowerCase();
          matchType = "exact";
          exactMatchesCount++;
        }
      }

      // 3. Try fuzzy heuristics list
      if (!matchedKey) {
        for (const pattern of matchPatterns) {
          if (rawHeaders.includes(pattern.toLowerCase())) {
            matchedKey = pattern.toLowerCase();
            matchType = "heuristic";
            break;
          }
        }
      }

      if (matchedKey) {
        mappings[standardKey] = matchedKey;
        matchesCount++;
        logCollector.push({ 
          type: "success", 
          message: `Mapped raw column "${matchedKey}" to standard key "${standardKey}" (${matchType})` 
        });
      } else {
        logCollector.push({ 
          type: "warn", 
          message: `Required standard key "${standardKey}" could not be matched automatically.` 
        });
      }
    }

    // Calculate Mapping Confidence percentage
    const heuristicCount = matchesCount - exactMatchesCount;
    const matchRatio = requiredKeys.length > 0 ? (exactMatchesCount * 1.0 + heuristicCount * 0.96) / requiredKeys.length : 1.0;
    mappings._confidence = Math.round(matchRatio * 100);

    return mappings;
  },

  /**
   * Applies normalization, type casting, duplicate removal, and data quality scoring
   */
  cleanAndNormalize(rawRows, headerMap, schemaType, logCollector = []) {
    const cleanedRows = [];
    const seenKeys = new Set();
    let duplicateCount = 0;
    let missingFieldsCount = 0;
    let invalidNumbersCount = 0;

    logCollector.push({ type: "info", message: `Executing validation routines for ${rawRows.length} rows` });

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const normalizedRow = {};
      let rowValid = true;

      for (const [standardKey, rawKey] of Object.entries(headerMap)) {
        if (standardKey.startsWith("_")) continue;
        normalizedRow[standardKey] = rawRow[rawKey];
      }

      if (schemaType === "salesMix") {
        if (!normalizedRow.itemName) {
          logCollector.push({ type: "warn", message: `Row ${i + 1}: Missing item name. Skipped.` });
          rowValid = false;
          missingFieldsCount++;
          continue;
        }

        normalizedRow.quantity = parseInt(normalizedRow.quantity, 10);
        if (isNaN(normalizedRow.quantity)) {
          logCollector.push({ type: "warn", message: `Row ${i + 1}: Invalid volume "${rawRow[headerMap.quantity]}". Defaulted to 0.` });
          normalizedRow.quantity = 0;
          invalidNumbersCount++;
        }

        normalizedRow.price = parseFloat(normalizedRow.price);
        if (isNaN(normalizedRow.price) || normalizedRow.price <= 0) {
          logCollector.push({ type: "warn", message: `Row ${i + 1}: Invalid retail price. Defaulted to 10.00.` });
          normalizedRow.price = 10.00;
          invalidNumbersCount++;
        }

        normalizedRow.sales = parseFloat(normalizedRow.sales);
        if (isNaN(normalizedRow.sales)) {
          normalizedRow.sales = normalizedRow.quantity * normalizedRow.price;
          missingFieldsCount++;
        }

        const rawCost = normalizedRow.itemCost;
        normalizedRow.itemCost = parseFloat(rawCost);
        if (isNaN(normalizedRow.itemCost) || rawCost === "N/A") {
          const interpolatedCost = Math.round((normalizedRow.price * 0.30) * 100) / 100;
          normalizedRow.itemCost = interpolatedCost;
          missingFieldsCount++;
          logCollector.push({ 
            type: "warn", 
            message: `Row ${i + 1} (${normalizedRow.itemName}): Missing cost. Interpolated to default COGS average ($${interpolatedCost.toFixed(2)}).` 
          });
        }
      } 
      
      else if (schemaType === "laborLeakage") {
        if (!normalizedRow.timestamp) {
          logCollector.push({ type: "warn", message: `Row ${i + 1}: Missing interval time. Skipped.` });
          rowValid = false;
          missingFieldsCount++;
          continue;
        }

        if (seenKeys.has(normalizedRow.timestamp)) {
          duplicateCount++;
          continue; 
        }
        seenKeys.add(normalizedRow.timestamp);

        normalizedRow.sales = parseFloat(normalizedRow.sales);
        if (isNaN(normalizedRow.sales)) {
          normalizedRow.sales = 0.00;
          invalidNumbersCount++;
        }

        normalizedRow.laborHours = parseFloat(normalizedRow.laborHours);
        if (isNaN(normalizedRow.laborHours)) {
          normalizedRow.laborHours = 0.0;
          invalidNumbersCount++;
        } else if (normalizedRow.laborHours < 0) {
          const correctedHours = Math.abs(normalizedRow.laborHours);
          normalizedRow.laborHours = correctedHours;
          invalidNumbersCount++;
          logCollector.push({ 
            type: "warn", 
            message: `Row ${i + 1} (${normalizedRow.timestamp}): Negative labor hours corrected to absolute value (${correctedHours}).` 
          });
        }

        const rawLaborCost = normalizedRow.laborCost;
        normalizedRow.laborCost = parseFloat(rawLaborCost);
        if (isNaN(normalizedRow.laborCost) || !rawLaborCost) {
          const interpolatedCost = Math.round((normalizedRow.laborHours * 19.00) * 100) / 100;
          normalizedRow.laborCost = interpolatedCost;
          missingFieldsCount++;
          logCollector.push({ 
            type: "warn", 
            message: `Row ${i + 1} (${normalizedRow.timestamp}): Missing cost. Interpolated to average wage base ($$19.00/hr) -> $${interpolatedCost.toFixed(2)}.` 
          });
        }
      } 
      
      else if (schemaType === "voidLog") {
        if (!normalizedRow.transactionId) {
          logCollector.push({ type: "warn", message: `Row ${i + 1}: Missing transaction ID. Skipped.` });
          rowValid = false;
          missingFieldsCount++;
          continue;
        }

        if (!normalizedRow.serverName) {
          normalizedRow.serverName = "Staff Override";
          missingFieldsCount++;
        }

        normalizedRow.ticketTotal = parseFloat(normalizedRow.ticketTotal);
        if (isNaN(normalizedRow.ticketTotal)) {
          normalizedRow.ticketTotal = 0.00;
          invalidNumbersCount++;
        }

        normalizedRow.voidAmount = parseFloat(normalizedRow.voidAmount);
        if (isNaN(normalizedRow.voidAmount)) {
          normalizedRow.voidAmount = 0.00;
          invalidNumbersCount++;
        }
      }

      if (rowValid) {
        cleanedRows.push(normalizedRow);
      }
    }

    const totalCells = cleanedRows.length * Object.keys(headerMap).filter(k=>!k.startsWith("_")).length;
    const missingFieldsPercent = totalCells > 0 ? Math.round((missingFieldsCount / totalCells) * 100) : 0;
    const duplicateRatio = rawRows.length > 0 ? duplicateCount / rawRows.length : 0;
    const timestampConsistency = Math.max(0, 100 - Math.round(duplicateRatio * 100));
    const headerMatchConfidence = headerMap._confidence || 100;

    const rawScore = headerMatchConfidence - (missingFieldsCount * 2) - (duplicateCount * 5) - (invalidNumbersCount * 3);
    const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    cleanedRows.qualityMetrics = {
      totalRows: cleanedRows.length,
      missingFieldsPercent,
      duplicateRowsCount: duplicateCount,
      invalidNumbersCount,
      headerMatchConfidence,
      timestampConsistency,
      overallScore
    };

    return cleanedRows;
  },

  /**
   * Main entrypoint to process raw data. Intercepts missing headers and raises exceptions
   */
  process(rawText, schemaType, logCollector = [], manualOverrides = {}) {
    const { headers, rows } = this.parseCSV(rawText, logCollector);
    const headerMap = this.normalizeHeaders(headers, schemaType, logCollector, manualOverrides);
    
    const requiredFields = Object.keys(this.mappings[schemaType]);
    const mappedKeys = Object.keys(headerMap).filter(k => !k.startsWith("_"));
    
    if (mappedKeys.length < requiredFields.length) {
      const missing = requiredFields.filter(f => !mappedKeys.includes(f));
      logCollector.push({ 
        type: "error", 
        message: `Ingestion blocked: standard key mapping missing for [${missing.join(", ")}]` 
      });

      // Raise structured MappingError for UI human-in-the-loop intercept
      const err = new Error(`Missing columns: ${missing.join(", ")}`);
      err.name = "MappingError";
      err.schemaType = schemaType;
      err.missingKeys = missing;
      err.rawHeaders = headers;
      throw err;
    }

    return this.cleanAndNormalize(rows, headerMap, schemaType, logCollector);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Parsers;
}

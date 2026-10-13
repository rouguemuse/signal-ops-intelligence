/**
 * Signal Operations Unit Tests - Parser Normalization
 */

const ParserTests = {
  run(Parsers, assertEqual) {
    const logs = [];
    const testLogs = [];

    // Test 1: Header fuzzy matching
    const rawHeaders = ["date_time_period", "hourly_sales_total", "hours_clocked", "payroll_spend_total"];
    const mappings = Parsers.normalizeHeaders(rawHeaders, "laborLeakage", testLogs);
    assertEqual(mappings.timestamp, "date_time_period", "Should match date_time_period to timestamp");
    assertEqual(mappings.sales, "hourly_sales_total", "Should match hourly_sales_total to sales");
    assertEqual(mappings.laborHours, "hours_clocked", "Should match hours_clocked to laborHours");
    assertEqual(mappings.laborCost, "payroll_spend_total", "Should match payroll_spend_total to laborCost");
    logs.push("✓ Header normalizer mapped fuzzy fields correctly");

    // Test 2: Invalid values (negative hours, missing costs) correction
    const rawCSV = `date_time_period,hourly_sales_total,hours_clocked,payroll_spend_total
2026-06-02T15:00:00,100.00,-4.5,
# Duplicate row to test deduplication
2026-06-02T15:00:00,100.00,-4.5,`;

    const cleaned = Parsers.process(rawCSV, "laborLeakage", testLogs);
    
    // Deduplication check
    assertEqual(cleaned.length, 1, "Should filter duplicate rows");
    
    // Negative hours correction
    assertEqual(cleaned[0].laborHours, 4.5, "Negative hours must be converted to absolute value");
    
    // Missing labor cost interpolation (4.5 hours * $19.00 blended rate = $85.50)
    assertEqual(cleaned[0].laborCost, 85.50, "Missing labor cost must be interpolated");
    // Test 3: Quoted currency and comma thousands separator parsing
    const rawSalesCSV = `product_name,dept_group,qty_sold,net_revenue_total,recipe_cost,retail_price
"Truffle Burger",Entrees,"1,250","$18,750.00","$6.50","$15.00"`;
    const cleanedSales = Parsers.process(rawSalesCSV, "salesMix", testLogs);
    assertEqual(cleanedSales[0].quantity, 1250, "Quoted volume with comma thousands separator must parse to integer 1250");
    assertEqual(cleanedSales[0].sales, 18750.00, "Quoted revenue with currency and comma must parse to float 18750.00");
    assertEqual(cleanedSales[0].itemCost, 6.50, "Quoted item cost must parse to 6.50");
    logs.push("✓ Quoted numbers with currency symbols and comma separators parsed accurately");

    // Test 4: Missing required columns should throw structured MappingError
    let threwMappingError = false;
    try {
      const incompleteCSV = `unrelated_col1,unrelated_col2\nfoo,bar`;
      Parsers.process(incompleteCSV, "salesMix", testLogs);
    } catch (err) {
      if (err.name === "MappingError" && err.missingKeys && err.missingKeys.length > 0) {
        threwMappingError = true;
      }
    }
    assertEqual(threwMappingError, true, "Missing required headers must throw MappingError");
    logs.push("✓ Ingestion halted on missing headers with structured MappingError");

    return logs;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParserTests;
}

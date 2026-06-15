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
    logs.push("✓ Cleanser successfully corrected negative numbers & interpolated missing fields");

    return logs;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParserTests;
}

/**
 * Signal Operations - Browser Test Runner
 * 
 * Reuses the same deterministic test files in the browser environment,
 * logging test outputs into a visual console.
 */

const BrowserTestRunner = {
  runAll() {
    const logs = [];
    
    const assertEqual = (actual, expected, message) => {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}" but got "${actual}". (${message})`);
      }
    };

    const assertAlmostEqual = (actual, expected, tolerance = 0.05, message) => {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ${expected} (+/- ${tolerance}) but got ${actual}. (${message})`);
      }
    };

    try {
      logs.push({ type: "info", text: "Initiating deterministic test runner..." });
      
      // 1. Run Parser normalizations
      const parserLogs = ParserTests.run(Parsers, assertEqual);
      parserLogs.forEach(log => logs.push({ type: "pass", text: `Parser: ${log}` }));

      // 2. Run Diagnostics calculations
      const diagLogs = DiagnosticsTests.run(Diagnostics, assertEqual, assertAlmostEqual);
      diagLogs.forEach(log => logs.push({ type: "pass", text: `Diagnostics: ${log}` }));

      // 3. Run Evaluation scoring
      const evalLogs = EvaluationTests.run(Evaluation, assertEqual, assertAlmostEqual);
      evalLogs.forEach(log => logs.push({ type: "pass", text: `Evaluation: ${log}` }));

      logs.push({ type: "success", text: "PASS: All deterministic test vectors verified successfully." });
    } catch (err) {
      logs.push({ type: "fail", text: `FAIL: An assertion failed: ${err.message}` });
    }

    return logs;
  }
};

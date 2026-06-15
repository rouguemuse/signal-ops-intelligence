/**
 * Signal Operations - CLI Test Runner (Node.js)
 */

const Parsers = require('../js/parsers');
const Diagnostics = require('../js/diagnostics');
const Evaluation = require('../js/evaluation');

const ParserTests = require('./parser.test');
const DiagnosticsTests = require('./diagnostics.test');
const EvaluationTests = require('./evaluation.test');

// Assert helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`\x1b[31m[FAIL] Assertion Failed: Expected "${expected}", got "${actual}"\x1b[0m`);
    throw new Error(message || "Equivalency failure");
  }
}

function assertAlmostEqual(actual, expected, tolerance = 0.05, message) {
  if (Math.abs(actual - expected) > tolerance) {
    console.error(`\x1b[31m[FAIL] Assertion Failed: Expected ${expected} (+/- ${tolerance}), got ${actual}\x1b[0m`);
    throw new Error(message || "Tolerance failure");
  }
}

console.log("\x1b[34m==================================================\x1b[0m");
console.log("\x1b[34m   SIGNAL DETERMINISTIC TEST SUITE RUNNER         \x1b[0m");
console.log("\x1b[34m==================================================\x1b[0m");

try {
  console.log("\nRunning Parser Tests...");
  const parserLogs = ParserTests.run(Parsers, assertEqual);
  parserLogs.forEach(l => console.log(`  ${l}`));

  console.log("\nRunning Diagnostics Engine Tests...");
  const diagLogs = DiagnosticsTests.run(Diagnostics, assertEqual, assertAlmostEqual);
  diagLogs.forEach(l => console.log(`  ${l}`));

  console.log("\nRunning Evaluation Engine Tests...");
  const evalLogs = EvaluationTests.run(Evaluation, assertEqual, assertAlmostEqual);
  evalLogs.forEach(l => console.log(`  ${l}`));

  console.log("\n\x1b[32m[PASS] All deterministic test vectors passed successfully.\x1b[0m\n");
} catch (err) {
  console.error(`\n\x1b[41m[HALT] Test suite failed: ${err.message}\x1b[0m\n`);
  process.exit(1);
}

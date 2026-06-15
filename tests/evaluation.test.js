/**
 * Signal Operations Unit Tests - Evaluation Engine
 */

const EvaluationTests = {
  run(Evaluation, assertEqual, assertAlmostEqual) {
    const logs = [];

    // Mock diagnostic data and mock quality metrics
    const mockDiagnostics = {
      salesMix: {
        summary: { averageCM: 10.00 },
        items: [
          { itemName: "Dog Item", classification: "Dog", quantity: 10, price: 10.00, itemCost: 5.00, salesMixPercent: 1.0 }
        ]
      },
      labor: { intervals: [] },
      voids: { servers: [] }
    };
    
    const mockQuality = {
      missingFieldsPercent: 0,
      invalidNumbersCount: 0
    };

    const evaluationOutput = Evaluation.evaluate(mockDiagnostics, mockQuality);
    
    assertEqual(evaluationOutput.recommendations.length, 1, "Should create 1 recommendation");
    
    const rec = evaluationOutput.recommendations[0];
    
    // Savings: (5.00 - 2.50) * 10 units = $25.00 weekly savings
    assertEqual(rec.estWeeklySavings, 25.00, "Weekly savings math");
    
    // Severity: Financial (1, savings < 50) + Frequency (5, chronic dog) + Risk (3, prep burden) = 9/15
    assertEqual(rec.severityBreakdown.total, 9, "Severity total out of 15");
    
    // Confidence: Completeness (5, no missing) + Stability (3, units <= 10) + Quality (5, no corrections) = 13 / 3 = 4.3/5
    assertAlmostEqual(rec.confidenceBreakdown.total, 4.3, 0.1, "Confidence total out of 5");
    assertEqual(rec.confidenceBreakdown.label, "Medium", "Confidence label mapping");
    logs.push("✓ Severity score (15pt) & Confidence metrics (5pt) splits verified");

    // Test System Health Score formula
    // With 1 item having severity 9: 100 - (9 * 1.23) = 88.93 -> rounds to 89
    assertEqual(evaluationOutput.healthScore, 89, "System health score formula audit");
    logs.push("✓ System health score calculation formula validated");

    return logs;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EvaluationTests;
}

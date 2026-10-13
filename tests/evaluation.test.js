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

    // Test Single-Server Void Evaluation
    const singleServerDiagnostics = {
      salesMix: { summary: { averageCM: 10.00 }, items: [] },
      labor: { intervals: [] },
      voids: {
        summary: { totalSalesChecked: 1000, totalVoids: 50, averageVoidPercent: 5.0 },
        servers: [
          { serverName: "Solo Cashier", netSales: 1000, voidAmount: 50, ticketCount: 20, voidPercent: 5.0, isAnomaly: true, peerMean: 2.0, peerStdDev: 0.0, zScore: 0.0 }
        ]
      }
    };
    const evalSingleVoid = Evaluation.evaluate(singleServerDiagnostics, mockQuality);
    assertEqual(evalSingleVoid.recommendations.length, 1, "Should evaluate single server void anomaly without error");
    assertEqual(evalSingleVoid.recommendations[0].estWeeklySavings, 30.00, "Excess voids = 50 - (1000 * 0.02) = $30.00");
    assertAlmostEqual(evalSingleVoid.recommendations[0].confidenceBreakdown.total, 5.0, 0.1, "Single server void confidence");
    logs.push("✓ Single-server void recommendation evaluated defensibly without NaN");

    return logs;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EvaluationTests;
}

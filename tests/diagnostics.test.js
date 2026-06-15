/**
 * Signal Operations Unit Tests - Diagnostics Logic
 */

const DiagnosticsTests = {
  run(Diagnostics, assertEqual, assertAlmostEqual) {
    const logs = [];

    // Test 1: SPLH and Prime Cost
    const laborIntervals = [
      { timestamp: "2026-06-02T12:00:00", sales: 1000.00, laborHours: 10.0, laborCost: 190.00 },
      { timestamp: "2026-06-02T13:00:00", sales: 1450.00, laborHours: 12.5, laborCost: 228.00 }
    ];
    const laborDiagnostics = Diagnostics.analyzeLabor(laborIntervals);
    
    assertAlmostEqual(laborDiagnostics.summary.totalSales, 2450.00, 0.01, "Sales sum verification");
    assertAlmostEqual(laborDiagnostics.summary.totalLaborHours, 22.5, 0.01, "Hours sum verification");
    assertAlmostEqual(laborDiagnostics.summary.averageSPLH, 108.89, 0.01, "SPLH verification");
    logs.push("✓ Productivity metric (SPLH) calculated correctly");

    // Test 2: Menu Classification
    const menuItems = [
      { itemName: "Item A", category: "Burgers", quantity: 30, price: 18.00, itemCost: 6.00, sales: 540.00 },
      { itemName: "Item B", category: "Burgers", quantity: 40, price: 12.00, itemCost: 6.00, sales: 480.00 },
      { itemName: "Item C", category: "Burgers", quantity: 10, price: 22.00, itemCost: 7.00, sales: 220.00 },
      { itemName: "Item D", category: "Burgers", quantity: 20, price: 10.00, itemCost: 6.00, sales: 200.00 }
    ];
    const menuDiagnostics = Diagnostics.analyzeSalesMix(menuItems);
    
    // Weighted Average contribution margin is $8.30
    // Popularity threshold mix is 17.5%
    const itemMap = {};
    menuDiagnostics.items.forEach(item => { itemMap[item.itemName] = item.classification; });

    assertEqual(itemMap["Item A"], "Star", "Item A (Mix 30% >= 17.5%, CM $12.00 >= $8.30)");
    assertEqual(itemMap["Item B"], "Workhorse", "Item B (Mix 40% >= 17.5%, CM $6.00 < $8.30)");
    assertEqual(itemMap["Item C"], "Puzzle", "Item C (Mix 10% < 17.5%, CM $15.00 >= $8.30)");
    assertEqual(itemMap["Item D"], "Workhorse", "Item D (Mix 20% >= 17.5%, CM $4.00 < $8.30)");
    logs.push("✓ Smith-Kasavana Menu Engineering quadrant assignments validated");

    // Test 3: Z-Score Outlier Voids Flagging
    const serverRecords = [
      { serverName: "Server 1", ticketTotal: 2000.00, voidAmount: 10.00 }, // 0.5%
      { serverName: "Server 2", ticketTotal: 1500.00, voidAmount: 30.00 }, // 2.0%
      { serverName: "Server 3", ticketTotal: 2500.00, voidAmount: 12.50 }, // 0.5%
      { serverName: "Server 4", ticketTotal: 1800.00, voidAmount: 90.00 }  // 5.0%
    ];
    const voidDiagnostics = Diagnostics.analyzeVoids(serverRecords);
    const srvMap = {};
    voidDiagnostics.servers.forEach(s => { srvMap[s.serverName] = s; });

    assertAlmostEqual(srvMap["Server 4"].zScore, 1.63, 0.02, "Server 4 Outlier Z-Score");
    assertEqual(srvMap["Server 4"].isAnomaly, true, "Server 4 void outlier flag");
    assertEqual(srvMap["Server 1"].isAnomaly, false, "Server 1 normal flag");
    logs.push("✓ Server transaction void outlier Z-score flags verified");

    return logs;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiagnosticsTests;
}

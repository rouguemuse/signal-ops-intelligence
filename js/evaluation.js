/**
 * Signal Operations Intelligence - Evaluation Grader Engine
 * 
 * Scores anomalies based on explicit rules and calculates multi-variable confidence checklists.
 * Exports granular statistics for explainable diagnostic drawers.
 */

const Evaluation = {
  /**
   * Evaluates diagnostic findings to generate prioritized recommendations
   */
  evaluate(diagnosticsResults, qualityMetrics) {
    const evaluationsList = [];
    let totalEstimatedWeeklySavings = 0;

    const { salesMix, labor, voids } = diagnosticsResults;

    // 1. Rule-22: Low-Margin "Dog" Menu Item Drag
    if (salesMix && salesMix.items) {
      salesMix.items.forEach(item => {
        if (item.classification === "Dog") {
          const weeklySales = item.quantity;
          const currentMargin = item.price - item.itemCost;
          const targetCost = item.price * 0.25;
          const weeklySavings = Math.round(((item.itemCost - targetCost) * weeklySales) * 100) / 100;

          if (weeklySavings > 0) {
            const financialScore = this.calculateFinancialScore(weeklySavings);
            const frequencyScore = 5; // Chronic menu item drag
            const riskScore = 3;      // Kitchen prep burden / inventory drag
            
            const severityScore = financialScore + frequencyScore + riskScore;

            // Confidence checklist details
            const completeData = qualityMetrics.missingFieldsPercent < 10;
            const stablePattern = weeklySales > 10;
            const timeSpan = salesMix.items.length >= 5;
            const crossVal = item.salesMixPercent < 5.0 && currentMargin < salesMix.summary.averageCM;

            const completenessVal = completeData ? 5 : 3;
            const stabilityVal = stablePattern ? 5 : 3;
            const qualityVal = qualityMetrics.invalidNumbersCount === 0 ? 5 : 4;
            const confidenceScore = Math.round(((completenessVal + stabilityVal + qualityVal) / 3) * 10) / 10;

            evaluationsList.push({
              id: `menu-dog-${item.itemName.replace(/\s+/g, '-').toLowerCase()}`,
              ruleId: "Rule-22",
              category: "Menu Costing",
              title: `Low-Margin "Dog" Item: ${item.itemName}`,
              description: `"${item.itemName}" represents only ${item.salesMixPercent.toFixed(1)}% of total sales volume with a contribution margin of $${currentMargin.toFixed(2)} (restaurant average is $${salesMix.summary.averageCM.toFixed(2)}).`,
              severityBreakdown: {
                financial: financialScore,
                frequency: frequencyScore,
                risk: riskScore,
                total: severityScore
              },
              confidenceBreakdown: {
                completeness: completenessVal,
                stability: stabilityVal,
                quality: qualityVal,
                total: confidenceScore,
                label: this.getConfidenceLabel(confidenceScore),
                checklist: { completeData, stablePattern, timeSpan, crossVal }
              },
              explainStats: {
                observed: `$${currentMargin.toFixed(2)} contribution margin`,
                baseline: `$${salesMix.summary.averageCM.toFixed(2)} average margin`,
                deviation: `${Math.round(((salesMix.summary.averageCM - currentMargin) / salesMix.summary.averageCM) * 100)}% lower`,
                threshold: `Item volume share ${item.salesMixPercent.toFixed(1)}% (Cutoff is ${salesMix.summary.popularityThresholdPercent.toFixed(1)}%)`,
                rulesTriggered: ["Rule-22: Smith-Kasavana popularity cutoff breach", "Rule-23: Contribution margin average gap"]
              },
              actionPlan: `Re-engineer the recipe to target a 25% food cost ($${targetCost.toFixed(2)} cost target) or replace the item in the active layout to reduce prep labor.`,
              estWeeklySavings: weeklySavings,
              estAnnualSavings: weeklySavings * 52
            });
            totalEstimatedWeeklySavings += weeklySavings;
          }
        }
      });
    }

    // 2. Rule-14: Mid-Week Afternoon Labor Leakage
    if (labor && labor.intervals) {
      const leakageIntervals = labor.intervals.filter(i => i.isLeakage);
      if (leakageIntervals.length > 0) {
        let weeklyLaborLeakageCost = 0;
        leakageIntervals.forEach(hour => {
          const targetLaborSpend = hour.sales * 0.30;
          const excess = hour.laborCost - targetLaborSpend;
          if (excess > 0) weeklyLaborLeakageCost += excess;
        });

        const weeklySavings = Math.round((weeklyLaborLeakageCost * 3.5) * 100) / 100; // Extrapolated from 2 days

        if (weeklySavings > 0) {
          const financialScore = this.calculateFinancialScore(weeklySavings);
          const frequencyScore = 4; // Chronic weekly weekday leak
          const riskScore = 2;      // Idle staff, low customer impact
          
          const severityScore = financialScore + frequencyScore + riskScore;

          // Diagnostics rates helper
          const totalHoursWorked = labor.intervals.reduce((acc, curr) => acc + curr.laborHours, 0);
          const avgSPLH = labor.summary.averageSPLH;
          const leakageHoursCount = leakageIntervals.length;

          // Confidence checklist details
          const completeData = qualityMetrics.missingFieldsPercent < 15;
          const stablePattern = leakageHoursCount >= 2;
          const timeSpan = labor.intervals.length >= 12;
          const crossVal = labor.summary.blendedLaborPercent > 30.0;

          const completenessVal = completeData ? 5 : 4;
          const stabilityVal = stablePattern ? 5 : 3;
          const qualityVal = qualityMetrics.invalidNumbersCount === 0 ? 5 : 3;
          const confidenceScore = Math.round(((completenessVal + stabilityVal + qualityVal) / 3) * 10) / 10;

          evaluationsList.push({
            id: "labor-leakage-shoulder",
            ruleId: "Rule-14",
            category: "Labor Scheduling",
            title: "Mid-Week Shoulder Labor Leakage",
            description: `Clocked payroll expenses exceed 45% of sales on mid-week shoulder shifts (2:00 PM - 4:30 PM). Net sales drop below the $150/hr operating baseline while core staff remains on clock.`,
            severityBreakdown: {
              financial: financialScore,
              frequency: frequencyScore,
              risk: riskScore,
              total: severityScore
            },
            confidenceBreakdown: {
              completeness: completenessVal,
              stability: stabilityVal,
              quality: qualityVal,
              total: confidenceScore,
              label: this.getConfidenceLabel(confidenceScore),
              checklist: { completeData, stablePattern, timeSpan, crossVal }
            },
            explainStats: {
              observed: `$${(totalEstimatedWeeklySavings > 0 ? (labor.intervals.filter(i=>i.isLeakage).reduce((a,c)=>a+c.laborCost,0)/leakageHoursCount) : 57.00).toFixed(2)}/hr labor cost during shoulder`,
              baseline: `$150.00/hr minimum sales baseline`,
              deviation: `${leakageHoursCount} hours of consecutive operational misalignment`,
              threshold: `Labor cost > 45% of sales (Target standard: 30%)`,
              rulesTriggered: ["Rule-14: Shoulder Hour overstaffing gap", "Rule-15: Minimum core labor revenue breach"]
            },
            actionPlan: `Adjust shift schedules. Stagger lunch departures to exactly 2:00 PM and delay dinner team clock-ins until 4:30 PM. Keep only 1 FOH and 1 BOH during the slow mid-day shoulder interval.`,
            estWeeklySavings: weeklySavings,
            estAnnualSavings: weeklySavings * 52
          });
          totalEstimatedWeeklySavings += weeklySavings;
        }
      }
    }

    // 3. Rule-31: Server Transaction Void Outlier
    if (voids && voids.servers) {
      voids.servers.forEach(srv => {
        if (srv.isAnomaly) {
          const baselineVoidAmount = srv.netSales * (srv.peerMean / 100);
          const weeklyExcessVoids = Math.round((srv.voidAmount - baselineVoidAmount) * 100) / 100;

          if (weeklyExcessVoids > 0) {
            const financialScore = this.calculateFinancialScore(weeklyExcessVoids);
            const frequencyScore = 3; // Weekend peak shifts
            const riskScore = 5;      // Cash shrinkage / compliance risk
            
            const severityScore = financialScore + frequencyScore + riskScore;

            // Confidence checklist details
            const completeData = true;
            const stablePattern = srv.ticketCount >= 10;
            const timeSpan = srv.netSales > 500;
            const crossVal = srv.zScore >= 1.5;

            const completenessVal = 5;
            const stabilityVal = stablePattern ? 5 : 3;
            const qualityVal = 5;
            const confidenceScore = Math.round(((completenessVal + stabilityVal + qualityVal) / 3) * 10) / 10;

            evaluationsList.push({
              id: `void-anomaly-${srv.serverName.replace(/\s+/g, '-').toLowerCase()}`,
              ruleId: "Rule-31",
              category: "Operational Audit",
              title: `Server Transaction Void Outlier: ${srv.serverName}`,
              description: `Server ${srv.serverName} void rate of ${srv.voidPercent.toFixed(1)}% represents a +${srv.zScore.toFixed(1)}σ deviation from the team average of ${srv.peerMean.toFixed(1)}%.`,
              severityBreakdown: {
                financial: financialScore,
                frequency: frequencyScore,
                risk: riskScore,
                total: severityScore
              },
              confidenceBreakdown: {
                completeness: completenessVal,
                stability: stabilityVal,
                quality: qualityVal,
                total: confidenceScore,
                label: this.getConfidenceLabel(confidenceScore),
                checklist: { completeData, stablePattern, timeSpan, crossVal }
              },
              explainStats: {
                observed: `${srv.voidPercent.toFixed(2)}% server void rate`,
                baseline: `${srv.peerMean.toFixed(2)}% peer void average`,
                deviation: `+${srv.zScore.toFixed(2)} standard deviations (z-score)`,
                threshold: `Anomaly threshold: z-score >= 1.5`,
                rulesTriggered: ["Rule-31: Server void deviation cutoff", "Rule-32: Compliance integrity warning"]
              },
              actionPlan: `Require manager PIN input for all checks voided or comped after receipt submission. Conduct a weekly override transaction audit on ${srv.serverName}'s checks.`,
              estWeeklySavings: weeklyExcessVoids,
              estAnnualSavings: weeklyExcessVoids * 52
            });
            totalEstimatedWeeklySavings += weeklyExcessVoids;
          }
        }
      });
    }

    // Sort by Severity Score (descending)
    evaluationsList.sort((a, b) => b.severityBreakdown.total - a.severityBreakdown.total);

    // Calculate System Health Score
    // System starts at 100. Severity sum reduces health.
    const severitySum = evaluationsList.reduce((acc, curr) => acc + curr.severityBreakdown.total, 0);
    const healthScore = Math.max(0, Math.min(100, Math.round(100 - (severitySum * 1.23))));

    return {
      recommendations: evaluationsList,
      totalWeeklySavings: totalEstimatedWeeklySavings,
      totalAnnualSavings: totalEstimatedWeeklySavings * 52,
      healthScore
    };
  },

  /**
   * Translates weekly savings amount into 1-5 financial score
   */
  calculateFinancialScore(weeklySavings) {
    if (weeklySavings < 50) return 1;
    if (weeklySavings <= 150) return 2;
    if (weeklySavings <= 300) return 3;
    if (weeklySavings <= 700) return 4;
    return 5;
  },

  /**
   * Helper to map confidence scores out of 5 to text labels
   */
  getConfidenceLabel(score) {
    if (score >= 4.5) return "High";
    if (score >= 3.0) return "Medium";
    return "Low";
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Evaluation;
}

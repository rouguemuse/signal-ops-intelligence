/**
 * Signal Operations Intelligence - Diagnostics Engine
 * 
 * Implements deterministic calculation models for restaurant operational audits.
 */

const Diagnostics = {
  /**
   * Evaluates the Sales Mix (Product Mix / PMIX) dataset
   */
  analyzeSalesMix(items) {
    if (!items || items.length === 0) return null;

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    items.forEach(item => {
      totalRevenue += item.sales;
      totalCost += (item.itemCost * item.quantity);
      totalItemsSold += item.quantity;
    });

    const cogsPercent = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
    const menuSize = items.length;

    // Smith-Kasavana Thresholds:
    // 1. Popularity threshold: 70% of average item share (1 / N)
    const popularityThresholdPercent = menuSize > 0 ? (0.70 * (1 / menuSize)) * 100 : 0;
    
    // 2. Profitability threshold: weighted average contribution margin
    let weightedCMTotal = 0;
    items.forEach(item => {
      item.contributionMargin = item.price - item.itemCost;
      weightedCMTotal += (item.contributionMargin * item.quantity);
    });
    const averageCM = totalItemsSold > 0 ? weightedCMTotal / totalItemsSold : 0;

    // Classify menu items
    const classifiedItems = items.map(item => {
      const salesMixPercent = totalItemsSold > 0 ? (item.quantity / totalItemsSold) * 100 : 0;
      const contributionMargin = item.price - item.itemCost;

      const isHighPopularity = salesMixPercent >= popularityThresholdPercent;
      const isHighProfitability = contributionMargin >= averageCM;

      let classification = "";
      if (isHighPopularity && isHighProfitability) classification = "Star";
      else if (isHighPopularity && !isHighProfitability) classification = "Workhorse";
      else if (!isHighPopularity && isHighProfitability) classification = "Puzzle";
      else classification = "Dog";

      return {
        ...item,
        contributionMargin,
        salesMixPercent,
        classification
      };
    });

    return {
      summary: {
        totalRevenue,
        totalCost,
        cogsPercent,
        totalItemsSold,
        averageCM,
        popularityThresholdPercent
      },
      items: classifiedItems
    };
  },

  /**
   * Evaluates Labor schedules paired with Hourly Net Sales
   */
  analyzeLabor(intervals) {
    if (!intervals || intervals.length === 0) return null;

    let totalSales = 0;
    let totalLaborHours = 0;
    let totalLaborCost = 0;

    intervals.forEach(hour => {
      totalSales += hour.sales;
      totalLaborHours += hour.laborHours;
      totalLaborCost += hour.laborCost;
    });

    const blendedLaborPercent = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;
    const averageSPLH = totalLaborHours > 0 ? totalSales / totalLaborHours : 0;

    // Baseline Operating Sales Threshold for Bistro (assuming core FOH/BOH staffing levels)
    // 3 employees at avg $19/hr cost = $57 wage. At target 30% labor cost, sales baseline is $190/hr.
    // We flag leakage if hours labor percent exceeds 45% AND hourly sales drops below $150.
    const baselineSales = 150.00; 

    const processedIntervals = intervals.map(hour => {
      const laborPercent = hour.sales > 0 ? (hour.laborCost / hour.sales) * 100 : 0;
      const splh = hour.laborHours > 0 ? hour.sales / hour.laborHours : 0;
      
      const isLeakage = laborPercent > 45 && hour.sales < baselineSales && hour.laborHours > 2.0;

      return {
        ...hour,
        laborPercent,
        splh,
        isLeakage
      };
    });

    return {
      summary: {
        totalSales,
        totalLaborHours,
        totalLaborCost,
        blendedLaborPercent,
        averageSPLH
      },
      intervals: processedIntervals
    };
  },

  /**
   * Evaluates Void Transaction Log audits
   */
  analyzeVoids(records) {
    if (!records || records.length === 0) return null;

    // 1. Rollup totals by cashier/server
    const servers = {};
    let totalSalesChecked = 0;
    let totalVoids = 0;

    records.forEach(rec => {
      const server = rec.serverName;
      if (!servers[server]) {
        servers[server] = { serverName: server, netSales: 0, voidAmount: 0, ticketCount: 0 };
      }
      servers[server].netSales += rec.ticketTotal;
      servers[server].voidAmount += rec.voidAmount;
      servers[server].ticketCount++;

      totalSalesChecked += rec.ticketTotal;
      totalVoids += rec.voidAmount;
    });

    const serverList = Object.values(servers).map(srv => {
      srv.voidPercent = srv.netSales > 0 ? (srv.voidAmount / srv.netSales) * 100 : 0;
      return srv;
    });

    const averageVoidPercent = totalSalesChecked > 0 ? (totalVoids / totalSalesChecked) * 100 : 0;

    // 2. Statistical standard deviations check (Z-Score)
    const serverCount = serverList.length;
    let zScoresComputed = [];

    if (serverCount > 1) {
      // Mean of void rates
      const ratesMean = serverList.reduce((acc, curr) => acc + curr.voidPercent, 0) / serverCount;
      
      // Variance
      const varianceSum = serverList.reduce((acc, curr) => acc + Math.pow(curr.voidPercent - ratesMean, 2), 0);
      const ratesVariance = varianceSum / serverCount;
      const ratesStdDev = Math.sqrt(ratesVariance);

      zScoresComputed = serverList.map(srv => {
        // Handle division by zero if there is no variation
        const zScore = ratesStdDev > 0 ? (srv.voidPercent - ratesMean) / ratesStdDev : 0.0;
        const isAnomaly = zScore >= 1.5;

        return {
          ...srv,
          zScore,
          isAnomaly,
          peerMean: ratesMean,
          peerStdDev: ratesStdDev
        };
      });
    } else {
      zScoresComputed = serverList.map(srv => ({
        ...srv,
        zScore: 0.0,
        isAnomaly: srv.voidPercent > 4.0 // Flat threshold fallback for single-server lists
      }));
    }

    return {
      summary: {
        totalSalesChecked,
        totalVoids,
        averageVoidPercent
      },
      servers: zScoresComputed
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Diagnostics;
}

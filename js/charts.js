/**
 * Signal Operations Intelligence - Custom SVG Charting Module
 * 
 * Generates lightweight, responsive, vector-based visualizations
 * directly into the browser DOM using raw SVG APIs.
 */

const Charts = {
  /**
   * Helper to clean a container element
   */
  clear(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }
    return container;
  },

  /**
   * Renders Hourly Sales vs Labor Cost (Bar/Line Overlay)
   */
  renderLabor(containerId, intervals) {
    const container = this.clear(containerId);
    if (!container || !intervals || intervals.length === 0) return;

    const width = 600;
    const height = 280;
    const padding = { top: 30, right: 50, bottom: 45, left: 60 };

    // Find min/max boundaries
    const maxSales = Math.max(...intervals.map(i => i.sales), 100);
    const maxHours = Math.max(...intervals.map(i => i.laborHours), 1);

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible";

    // Draw grid lines & Left Y-Axis labels (Sales)
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = (maxSales / yTicks) * i;
      const y = height - padding.bottom - ((height - padding.top - padding.bottom) / yTicks) * i;
      
      // Grid line
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
      grid.setAttribute("x1", padding.left);
      grid.setAttribute("y1", y);
      grid.setAttribute("x2", width - padding.right);
      grid.setAttribute("y2", y);
      grid.setAttribute("stroke", "#e5e7eb");
      grid.setAttribute("stroke-dasharray", "4,4");
      svg.appendChild(grid);

      // Label (Sales)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", padding.left - 10);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#6b7280");
      label.style.fontFamily = "system-ui, sans-serif";
      label.style.fontSize = "10px";
      label.textContent = `$${Math.round(yVal)}`;
      svg.appendChild(label);
    }

    // Draw Right Y-Axis labels (Hours Worked)
    for (let i = 0; i <= yTicks; i++) {
      const yVal = (maxHours / yTicks) * i;
      const y = height - padding.bottom - ((height - padding.top - padding.bottom) / yTicks) * i;
      
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", width - padding.right + 10);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "start");
      label.setAttribute("fill", "#6b7280");
      label.style.fontFamily = "system-ui, sans-serif";
      label.style.fontSize = "10px";
      label.textContent = `${yVal.toFixed(1)}h`;
      svg.appendChild(label);
    }

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = Math.max(2, (chartWidth / intervals.length) * 0.6);
    const spacing = (chartWidth / intervals.length);

    // Draw Bars (Hourly Sales) and Line Points (Labor Hours)
    let linePathData = "";

    intervals.forEach((interval, idx) => {
      const x = padding.left + (idx * spacing) + (spacing / 2);
      
      // Sales Bar
      const barHeight = (interval.sales / maxSales) * chartHeight;
      const barY = height - padding.bottom - barHeight;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x - barWidth / 2);
      rect.setAttribute("y", barY);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", Math.max(1, barHeight));
      // Color coding - highlight leakage intervals
      rect.setAttribute("fill", interval.isLeakage ? "#f87171" : "#818cf8");
      rect.setAttribute("rx", "2");
      
      // Add simple SVG title tooltip
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `Time: ${interval.timestamp.split("T")[1]}\nSales: $${interval.sales.toFixed(2)}\nLabor hours: ${interval.laborHours}h\nLabor Cost %: ${interval.laborPercent.toFixed(1)}%`;
      rect.appendChild(title);
      svg.appendChild(rect);

      // Hourly Hours Line Node
      const lineY = height - padding.bottom - (interval.laborHours / maxHours) * chartHeight;
      if (idx === 0) {
        linePathData = `M ${x} ${lineY}`;
      } else {
        linePathData += ` L ${x} ${lineY}`;
      }

      // X-Axis hour label (e.g. 11:00)
      if (idx % 2 === 0) {
        const timePart = interval.timestamp.split("T")[1].substring(0, 5);
        const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xLabel.setAttribute("x", x);
        xLabel.setAttribute("y", height - padding.bottom + 16);
        xLabel.setAttribute("text-anchor", "middle");
        xLabel.setAttribute("fill", "#6b7280");
        xLabel.style.fontFamily = "system-ui, sans-serif";
        xLabel.style.fontSize = "9px";
        xLabel.textContent = timePart;
        svg.appendChild(xLabel);
      }
    });

    // Draw Labor Hours overlay line
    if (linePathData) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", linePathData);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#10b981");
      line.setAttribute("stroke-width", "2.5");
      svg.appendChild(line);

      // Draw points on top
      intervals.forEach((interval, idx) => {
        const x = padding.left + (idx * spacing) + (spacing / 2);
        const lineY = height - padding.bottom - (interval.laborHours / maxHours) * chartHeight;

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", lineY);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#ffffff");
        circle.setAttribute("stroke", "#10b981");
        circle.setAttribute("stroke-width", "2.5");
        
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${interval.laborHours} hours clocked`;
        circle.appendChild(title);
        svg.appendChild(circle);
      });
    }

    // Legend
    const legendSales = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    legendSales.setAttribute("x", padding.left);
    legendSales.setAttribute("y", 5);
    legendSales.setAttribute("width", "12");
    legendSales.setAttribute("height", "12");
    legendSales.setAttribute("fill", "#818cf8");
    svg.appendChild(legendSales);

    const legendSalesText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legendSalesText.setAttribute("x", padding.left + 18);
    legendSalesText.setAttribute("y", 15);
    legendSalesText.setAttribute("fill", "#4b5563");
    legendSalesText.style.fontFamily = "system-ui, sans-serif";
    legendSalesText.style.fontSize = "10px";
    legendSalesText.textContent = "Hourly Sales ($)";
    svg.appendChild(legendSalesText);

    const legendLeak = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    legendLeak.setAttribute("x", padding.left + 120);
    legendLeak.setAttribute("y", 5);
    legendLeak.setAttribute("width", "12");
    legendLeak.setAttribute("height", "12");
    legendLeak.setAttribute("fill", "#f87171");
    svg.appendChild(legendLeak);

    const legendLeakText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legendLeakText.setAttribute("x", padding.left + 138);
    legendLeakText.setAttribute("y", 15);
    legendLeakText.setAttribute("fill", "#4b5563");
    legendLeakText.style.fontFamily = "system-ui, sans-serif";
    legendLeakText.style.fontSize = "10px";
    legendLeakText.textContent = "Labor Leakage (Excess)";
    svg.appendChild(legendLeakText);

    const legendHours = document.createElementNS("http://www.w3.org/2000/svg", "line");
    legendHours.setAttribute("x1", padding.left + 280);
    legendHours.setAttribute("y1", 11);
    legendHours.setAttribute("x2", padding.left + 295);
    legendHours.setAttribute("y2", 11);
    legendHours.setAttribute("stroke", "#10b981");
    legendHours.setAttribute("stroke-width", "3");
    svg.appendChild(legendHours);

    const legendHoursText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legendHoursText.setAttribute("x", padding.left + 303);
    legendHoursText.setAttribute("y", 15);
    legendHoursText.setAttribute("fill", "#4b5563");
    legendHoursText.style.fontFamily = "system-ui, sans-serif";
    legendHoursText.style.fontSize = "10px";
    legendHoursText.textContent = "Labor Hours Clocked";
    svg.appendChild(legendHoursText);

    container.appendChild(svg);
  },

  /**
   * Renders Menu Engineering Scatter Matrix (Smith-Kasavana)
   */
  renderMenu(containerId, items, avgCM, popularityThreshold) {
    const container = this.clear(containerId);
    if (!container || !items || items.length === 0) return;

    const width = 600;
    const height = 400;
    const padding = { top: 40, right: 60, bottom: 50, left: 60 };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible";

    // Find bounding margins
    const maxSalesMix = Math.max(...items.map(i => i.salesMixPercent), 15);
    const maxCM = Math.max(...items.map(i => i.contributionMargin), avgCM * 2);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Coordinate conversion helpers
    const getX = (mixVal) => padding.left + (mixVal / maxSalesMix) * chartWidth;
    const getY = (cmVal) => height - padding.bottom - (cmVal / maxCM) * chartHeight;

    // Calculate dividing lines coordinates
    const splitX = getX(popularityThreshold);
    const splitY = getY(avgCM);

    // Draw Quadrants backgrounds (shaded)
    // 1. Stars (Top-Right): Light green tint
    const quadStar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    quadStar.setAttribute("x", splitX);
    quadStar.setAttribute("y", padding.top);
    quadStar.setAttribute("width", width - padding.right - splitX);
    quadStar.setAttribute("height", splitY - padding.top);
    quadStar.setAttribute("fill", "#f0fdf4");
    quadStar.setAttribute("opacity", "0.7");
    svg.appendChild(quadStar);

    // 2. Puzzles (Top-Left): Light blue tint
    const quadPuzzle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    quadPuzzle.setAttribute("x", padding.left);
    quadPuzzle.setAttribute("y", padding.top);
    quadPuzzle.setAttribute("width", splitX - padding.left);
    quadPuzzle.setAttribute("height", splitY - padding.top);
    quadPuzzle.setAttribute("fill", "#eff6ff");
    quadPuzzle.setAttribute("opacity", "0.7");
    svg.appendChild(quadPuzzle);

    // 3. Workhorses (Bottom-Right): Light yellow tint
    const quadWorkhorse = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    quadWorkhorse.setAttribute("x", splitX);
    quadWorkhorse.setAttribute("y", splitY);
    quadWorkhorse.setAttribute("width", width - padding.right - splitX);
    quadWorkhorse.setAttribute("height", height - padding.bottom - splitY);
    quadWorkhorse.setAttribute("fill", "#fef8e6");
    quadWorkhorse.setAttribute("opacity", "0.7");
    svg.appendChild(quadWorkhorse);

    // 4. Dogs (Bottom-Left): Light red/gray tint
    const quadDog = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    quadDog.setAttribute("x", padding.left);
    quadDog.setAttribute("y", splitY);
    quadDog.setAttribute("width", splitX - padding.left);
    quadDog.setAttribute("height", height - padding.bottom - splitY);
    quadDog.setAttribute("fill", "#fff5f5");
    quadDog.setAttribute("opacity", "0.7");
    svg.appendChild(quadDog);

    // Draw Quadrant Labels
    const drawQuadLabel = (text, x, y, anchor, color) => {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y);
      label.setAttribute("text-anchor", anchor);
      label.setAttribute("fill", color);
      label.style.fontFamily = "system-ui, sans-serif";
      label.style.fontSize = "12px";
      label.style.fontWeight = "bold";
      label.textContent = text;
      svg.appendChild(label);
    };

    drawQuadLabel("PUZZLES", padding.left + 15, padding.top + 20, "start", "#1e3a8a");
    drawQuadLabel("STARS", width - padding.right - 15, padding.top + 20, "end", "#15803d");
    drawQuadLabel("DOGS", padding.left + 15, height - padding.bottom - 15, "start", "#991b1b");
    drawQuadLabel("WORKHORSES", width - padding.right - 15, height - padding.bottom - 15, "end", "#854d0e");

    // Draw threshold divider lines
    const lineX = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineX.setAttribute("x1", splitX);
    lineX.setAttribute("y1", padding.top);
    lineX.setAttribute("x2", splitX);
    lineX.setAttribute("y2", height - padding.bottom);
    lineX.setAttribute("stroke", "#4b5563");
    lineX.setAttribute("stroke-width", "2");
    lineX.setAttribute("stroke-dasharray", "6,4");
    svg.appendChild(lineX);

    const lineY = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineY.setAttribute("x1", padding.left);
    lineY.setAttribute("y1", splitY);
    lineY.setAttribute("x2", width - padding.right);
    lineY.setAttribute("y2", splitY);
    lineY.setAttribute("stroke", "#4b5563");
    lineY.setAttribute("stroke-width", "2");
    lineY.setAttribute("stroke-dasharray", "6,4");
    svg.appendChild(lineY);

    // Draw X and Y Axis
    const axisY = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisY.setAttribute("x1", padding.left);
    axisY.setAttribute("y1", padding.top);
    axisY.setAttribute("x2", padding.left);
    axisY.setAttribute("y2", height - padding.bottom);
    axisY.setAttribute("stroke", "#374151");
    axisY.setAttribute("stroke-width", "2");
    svg.appendChild(axisY);

    const axisX = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisX.setAttribute("x1", padding.left);
    axisX.setAttribute("y1", height - padding.bottom);
    axisX.setAttribute("x2", width - padding.right);
    axisX.setAttribute("y2", height - padding.bottom);
    axisX.setAttribute("stroke", "#374151");
    axisX.setAttribute("stroke-width", "2");
    svg.appendChild(axisX);

    // Draw labels for axis lines
    // Y-Axis label (Contribution Margin)
    const labelY = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelY.setAttribute("transform", `rotate(-90 ${15} ${height / 2})`);
    labelY.setAttribute("x", 15);
    labelY.setAttribute("y", height / 2);
    labelY.setAttribute("text-anchor", "middle");
    labelY.setAttribute("fill", "#374151");
    labelY.style.fontFamily = "system-ui, sans-serif";
    labelY.style.fontSize = "11px";
    labelY.style.fontWeight = "bold";
    labelY.textContent = "Contribution Margin ($)";
    svg.appendChild(labelY);

    // X-Axis label (Sales Mix %)
    const labelX = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelX.setAttribute("x", width / 2);
    labelX.setAttribute("y", height - 10);
    labelX.setAttribute("text-anchor", "middle");
    labelX.setAttribute("fill", "#374151");
    labelX.style.fontFamily = "system-ui, sans-serif";
    labelX.style.fontSize = "11px";
    labelX.style.fontWeight = "bold";
    labelX.textContent = "Item Volume Sales Mix (%)";
    svg.appendChild(labelX);

    // Draw Threshold Values Texts
    const textThresholdY = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textThresholdY.setAttribute("x", width - padding.right - 5);
    textThresholdY.setAttribute("y", splitY - 5);
    textThresholdY.setAttribute("text-anchor", "end");
    textThresholdY.setAttribute("fill", "#4b5563");
    textThresholdY.style.fontFamily = "system-ui, sans-serif";
    textThresholdY.style.fontSize = "9px";
    textThresholdY.textContent = `Avg Margin: $${avgCM.toFixed(2)}`;
    svg.appendChild(textThresholdY);

    const textThresholdX = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textThresholdX.setAttribute("x", splitX + 5);
    textThresholdX.setAttribute("y", padding.top + 10);
    textThresholdX.setAttribute("text-anchor", "start");
    textThresholdX.setAttribute("fill", "#4b5563");
    textThresholdX.style.fontFamily = "system-ui, sans-serif";
    textThresholdX.style.fontSize = "9px";
    textThresholdX.textContent = `Popularity Cutoff: ${popularityThreshold.toFixed(1)}%`;
    svg.appendChild(textThresholdX);

    // Plot items
    items.forEach(item => {
      const x = getX(item.salesMixPercent);
      const y = getY(item.contributionMargin);

      // Draw bubble
      const bubble = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bubble.setAttribute("cx", x);
      bubble.setAttribute("cy", y);
      bubble.setAttribute("r", 8 + Math.sqrt(item.quantity) * 0.7); // size based on volume
      
      let bubbleColor = "#6b7280";
      if (item.classification === "Star") bubbleColor = "#10b981";
      else if (item.classification === "Workhorse") bubbleColor = "#eab308";
      else if (item.classification === "Puzzle") bubbleColor = "#3b82f6";
      else if (item.classification === "Dog") bubbleColor = "#ef4444";

      bubble.setAttribute("fill", bubbleColor);
      bubble.setAttribute("stroke", "#ffffff");
      bubble.setAttribute("stroke-width", "1.5");
      bubble.style.cursor = "pointer";

      // Tooltip
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${item.itemName} (${item.classification})\nSales Mix: ${item.salesMixPercent.toFixed(1)}%\nMargin: $${item.contributionMargin.toFixed(2)}\nUnits Sold: ${item.quantity}`;
      bubble.appendChild(title);
      svg.appendChild(bubble);

      // Label next to bubble (if sales mix is decent, or Dog to highlight)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x + 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("fill", "#111827");
      text.style.fontFamily = "system-ui, sans-serif";
      text.style.fontSize = "9px";
      text.style.fontWeight = "500";
      text.textContent = item.itemName;
      svg.appendChild(text);
    });

    container.appendChild(svg);
  },

  /**
   * Renders Server Void Rates Comparison Chart
   */
  renderVoids(containerId, servers, peerMean) {
    const container = this.clear(containerId);
    if (!container || !servers || servers.length === 0) return;

    const width = 600;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 40, left: 100 };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    const maxRate = Math.max(...servers.map(s => s.voidPercent), peerMean * 2, 4.0);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const rowHeight = chartHeight / servers.length;

    // Draw horizontal bars
    servers.forEach((srv, idx) => {
      const y = padding.top + (idx * rowHeight) + (rowHeight * 0.15);
      const barHeight = rowHeight * 0.7;
      const barWidth = (srv.voidPercent / maxRate) * chartWidth;

      // Server label
      const nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nameLabel.setAttribute("x", padding.left - 10);
      nameLabel.setAttribute("y", y + barHeight / 2 + 4);
      nameLabel.setAttribute("text-anchor", "end");
      nameLabel.setAttribute("fill", "#111827");
      nameLabel.style.fontFamily = "system-ui, sans-serif";
      nameLabel.style.fontSize = "11px";
      nameLabel.style.fontWeight = "bold";
      nameLabel.textContent = srv.serverName;
      svg.appendChild(nameLabel);

      // Bar
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", padding.left);
      rect.setAttribute("y", y);
      rect.setAttribute("width", Math.max(2, barWidth));
      rect.setAttribute("height", barHeight);
      rect.setAttribute("fill", srv.isAnomaly ? "#ef4444" : "#9ca3af");
      rect.setAttribute("rx", "3");

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `Server: ${srv.serverName}\nVoid Rate: ${srv.voidPercent.toFixed(2)}%\nTotal Voids: $${srv.voidAmount.toFixed(2)}\nZ-Score: ${srv.zScore.toFixed(2)}`;
      rect.appendChild(title);
      svg.appendChild(rect);

      // Value text after bar
      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("x", padding.left + barWidth + 8);
      valueLabel.setAttribute("y", y + barHeight / 2 + 4);
      valueLabel.setAttribute("text-anchor", "start");
      valueLabel.setAttribute("fill", srv.isAnomaly ? "#b91c1c" : "#4b5563");
      valueLabel.style.fontFamily = "system-ui, sans-serif";
      valueLabel.style.fontSize = "10px";
      valueLabel.style.fontWeight = srv.isAnomaly ? "bold" : "normal";
      valueLabel.textContent = `${srv.voidPercent.toFixed(1)}% (z=${srv.zScore.toFixed(1)})`;
      svg.appendChild(valueLabel);
    });

    // Draw Mean line divider
    const meanX = padding.left + (peerMean / maxRate) * chartWidth;
    
    const meanLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    meanLine.setAttribute("x1", meanX);
    meanLine.setAttribute("y1", padding.top);
    meanLine.setAttribute("x2", meanX);
    meanLine.setAttribute("y2", height - padding.bottom);
    meanLine.setAttribute("stroke", "#4b5563");
    meanLine.setAttribute("stroke-width", "1.5");
    meanLine.setAttribute("stroke-dasharray", "4,4");
    svg.appendChild(meanLine);

    const meanLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    meanLabel.setAttribute("x", meanX);
    meanLabel.setAttribute("y", height - padding.bottom + 15);
    meanLabel.setAttribute("text-anchor", "middle");
    meanLabel.setAttribute("fill", "#4b5563");
    meanLabel.style.fontFamily = "system-ui, sans-serif";
    meanLabel.style.fontSize = "9px";
    meanLabel.textContent = `Peer Mean: ${peerMean.toFixed(1)}%`;
    svg.appendChild(meanLabel);

    // Draw X-axis line
    const axisX = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisX.setAttribute("x1", padding.left);
    axisX.setAttribute("y1", height - padding.bottom);
    axisX.setAttribute("x2", width - padding.right);
    axisX.setAttribute("y2", height - padding.bottom);
    axisX.setAttribute("stroke", "#374151");
    axisX.setAttribute("stroke-width", "1.5");
    svg.appendChild(axisX);

    container.appendChild(svg);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}

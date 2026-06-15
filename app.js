/**
 * Signal Operations Intelligence - Application Coordinator
 * 
 * Manages ingestion pipelines, step-by-step loading telemetry,
 * manual header override wizard prompts, statistical detail accordions,
 * printable formatting hooks, and unit tests execution.
 */

const App = {
  // Global Application State
  state: {
    rawSalesMix: "",
    rawLabor: "",
    rawVoids: "",
    logs: [],
    manualOverrides: {
      salesMix: {},
      laborLeakage: {},
      voidLog: {}
    },
    diagnostics: {
      salesMix: null,
      labor: null,
      voids: null
    },
    qualityMetrics: {
      overallScore: 100,
      missingFieldsPercent: 0,
      duplicateRowsCount: 0,
      invalidNumbersCount: 0,
      headerMatchConfidence: 100,
      timestampConsistency: 100
    },
    auditSummary: {
      healthScore: 100,
      weeklySavings: 0,
      annualSavings: 0,
      recommendations: []
    },
    benchmarks: {
      parseTimeMs: 0,
      rowsProcessed: 0,
      matchAccuracy: 100,
      headerSuccess: 100
    },
    activePreset: "bistro"
  },

  /**
   * Initializes application components, runs system tests, and loads Bistro preset
   */
  init() {
    this.bindEvents();
    
    // Execute deterministic assertions on startup
    this.runSystemTests();

    // Default load: Bistro Royale
    this.loadDataset("bistro");
  },

  /**
   * Appends a log entry to the state log collector and refreshes the console view.
   */
  addLog(type, message) {
    const timestamp = new Date().toTimeString().split(" ")[0];
    this.state.logs.push({ type, message, timestamp });
    this.renderLogsConsole();
  },

  /**
   * Hooks DOM events
   */
  bindEvents() {
    // Tabs Navigation
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Preset Selectors
    const presetBtns = document.querySelectorAll(".sample-loader-btn");
    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.loadDataset(btn.dataset.scenario);
      });
    });

    // Custom Audit trigger
    const auditBtn = document.getElementById("run-audit-btn");
    if (auditBtn) {
      auditBtn.addEventListener("click", () => this.runCustomAudit());
    }

    // Print Report Trigger
    const printBtn = document.getElementById("btn-print-report");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }

    // Export JSON Trigger
    const exportJsonBtn = document.getElementById("btn-export-json");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => this.exportAuditJSON());
    }

    // Export Findings Trigger
    const exportFindingsBtn = document.getElementById("btn-export-findings");
    if (exportFindingsBtn) {
      exportFindingsBtn.addEventListener("click", () => this.exportFindingsMD());
    }

    // Manual test suite trigger
    const testBtn = document.getElementById("btn-run-tests");
    if (testBtn) {
      testBtn.addEventListener("click", () => this.runSystemTests());
    }

    // Simulate ambiguous header file mapping error
    const mapSimBtn = document.getElementById("btn-sim-map-err");
    if (mapSimBtn) {
      mapSimBtn.addEventListener("click", () => this.simulateHeaderError());
    }

    // File Upload Listeners
    const fileSales = document.getElementById("file-sales");
    if (fileSales) {
      fileSales.addEventListener("change", (e) => this.handleFileUpload(e, "salesMix"));
      fileSales.addEventListener("click", (e) => e.stopPropagation());
    }
    const fileLabor = document.getElementById("file-labor");
    if (fileLabor) {
      fileLabor.addEventListener("change", (e) => this.handleFileUpload(e, "laborLeakage"));
      fileLabor.addEventListener("click", (e) => e.stopPropagation());
    }
    const fileVoids = document.getElementById("file-voids");
    if (fileVoids) {
      fileVoids.addEventListener("change", (e) => this.handleFileUpload(e, "voidLog"));
      fileVoids.addEventListener("click", (e) => e.stopPropagation());
    }
  },

  /**
   * Reads raw CSV file from input slot client-side and triggers normalizer
   */
  handleFileUpload(event, schemaType) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      if (schemaType === "salesMix") {
        this.state.rawSalesMix = csvText;
      } else if (schemaType === "laborLeakage") {
        this.state.rawLabor = csvText;
      } else if (schemaType === "voidLog") {
        this.state.rawVoids = csvText;
      }
      this.addLog("success", `File "${file.name}" loaded successfully (${Math.round(file.size / 1024)} KB)`);
      this.updateUploaderInputs();
      this.runAuditPipeline();
    };
    reader.readAsText(file);
  },

  /**
   * Tab switcher
   */
  switchTab(tabId) {
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add("active");
      else btn.classList.remove("active");
    });

    contents.forEach(content => {
      if (content.id === `${tabId}-tab`) content.classList.remove("hidden");
      else content.classList.add("hidden");
    });
  },

  /**
   * Loads selected CSV strings and triggers pipeline
   */
  loadDataset(scenarioId) {
    this.state.activePreset = scenarioId;
    this.state.logs = [];
    this.state.manualOverrides = { salesMix: {}, laborLeakage: {}, voidLog: {} }; // Clear overrides
    
    // Hide header mapper
    const mapper = document.getElementById("header-mapping-wizard");
    if (mapper) mapper.classList.add("hidden");

    const dataset = samples[scenarioId];
    this.state.rawSalesMix = dataset.salesMix;
    this.state.rawLabor = dataset.labor;
    this.state.rawVoids = dataset.voids;

    this.addLog("info", `Loading preset client profile: "${dataset.name}"`);
    this.updateUploaderInputs();

    this.runAuditPipeline();
  },

  /**
   * Syncs state to textareas
   */
  updateUploaderInputs() {
    document.getElementById("csv-sales-mix").value = this.state.rawSalesMix;
    document.getElementById("csv-labor").value = this.state.rawLabor;
    document.getElementById("csv-voids").value = this.state.rawVoids;

    // Update uploader slots badges
    this.updateUploadBadge("badge-slot-sales", this.state.rawSalesMix ? "loaded" : "missing");
    this.updateUploadBadge("badge-slot-labor", this.state.rawLabor ? "loaded" : "missing");
    this.updateUploadBadge("badge-slot-voids", this.state.rawVoids ? "loaded" : "missing");
    this.updateUploadBadge("badge-slot-inventory", "optional");
    this.updateUploadBadge("badge-slot-foodcost", "optional");
  },

  updateUploadBadge(badgeId, status) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    badge.className = "slot-badge";
    if (status === "loaded") {
      badge.textContent = "✓ Ingested";
      badge.classList.add("badge-success");
    } else if (status === "optional") {
      badge.textContent = "○ Optional";
      badge.classList.add("badge-info");
    } else {
      badge.textContent = "⚠ Missing";
      badge.classList.add("badge-warning");
    }
  },

  /**
   * Triggers pipeline on custom textareas inputs
   */
  runCustomAudit() {
    this.state.logs = [];
    this.state.rawSalesMix = document.getElementById("csv-sales-mix").value.trim();
    this.state.rawLabor = document.getElementById("csv-labor").value.trim();
    this.state.rawVoids = document.getElementById("csv-voids").value.trim();

    this.updateUploaderInputs();
    this.runAuditPipeline();
  },

  /**
   * Ingest pipeline with sequential waterfall animation
   */
  runAuditPipeline() {
    const startTime = performance.now();
    
    // Initialize pipeline UI steps status to loading
    this.setPipelineWaterfallStatus("loading");

    // Sequential setTimeout chain to model a data-quality pipeline run (700ms total)
    setTimeout(() => {
      this.setPipelineWaterfallStep("step-parse", "pass");
      this.addLog("info", "Ingesting raw tabular strings...");
      
      setTimeout(() => {
        try {
          if (typeof Parsers === 'undefined' || typeof Diagnostics === 'undefined') {
            throw new Error("Ingestion parsing modules are not loaded.");
          }
          // Parse Sales Mix
          const cleanSales = Parsers.process(this.state.rawSalesMix, "salesMix", this.state.logs, this.state.manualOverrides);
          this.state.diagnostics.salesMix = Diagnostics.analyzeSalesMix(cleanSales);
          this.setPipelineWaterfallStep("step-header", "pass");

          setTimeout(() => {
            try {
              if (typeof Parsers === 'undefined' || typeof Diagnostics === 'undefined') {
                throw new Error("Ingestion parsing modules are not loaded.");
              }
              // Parse Labor scheduling
              const cleanLabor = Parsers.process(this.state.rawLabor, "laborLeakage", this.state.logs, this.state.manualOverrides);
              this.state.diagnostics.labor = Diagnostics.analyzeLabor(cleanLabor);
              this.setPipelineWaterfallStep("step-dedup", "pass");

              setTimeout(() => {
                try {
                  if (typeof Parsers === 'undefined' || typeof Diagnostics === 'undefined') {
                    throw new Error("Ingestion parsing modules are not loaded.");
                  }
                  // Parse Voids log
                  const cleanVoids = Parsers.process(this.state.rawVoids, "voidLog", this.state.logs, this.state.manualOverrides);
                  this.state.diagnostics.voids = Diagnostics.analyzeVoids(cleanVoids);
                  this.setPipelineWaterfallStep("step-validate", "pass");

                  setTimeout(() => {
                    try {
                      // Compile calculations
                      const qSales = cleanSales.qualityMetrics;
                      const qLabor = cleanLabor.qualityMetrics;
                      const qVoids = cleanVoids.qualityMetrics;

                      this.state.qualityMetrics = {
                        overallScore: Math.round((qSales.overallScore + qLabor.overallScore + qVoids.overallScore) / 3),
                        missingFieldsPercent: Math.round((qSales.missingFieldsPercent + qLabor.missingFieldsPercent + qVoids.missingFieldsPercent) / 3),
                        duplicateRowsCount: qSales.duplicateRowsCount + qLabor.duplicateRowsCount + qVoids.duplicateRowsCount,
                        invalidNumbersCount: qSales.invalidNumbersCount + qLabor.invalidNumbersCount + qVoids.invalidNumbersCount,
                        headerMatchConfidence: Math.round((qSales.headerMatchConfidence + qLabor.headerMatchConfidence + qVoids.headerMatchConfidence) / 3),
                        timestampConsistency: Math.round((qSales.timestampConsistency + qLabor.timestampConsistency + qVoids.timestampConsistency) / 3)
                      };

                      this.state.diagnostics.salesMix = Diagnostics.analyzeSalesMix(cleanSales);
                      this.state.diagnostics.labor = Diagnostics.analyzeLabor(cleanLabor);
                      this.state.diagnostics.voids = Diagnostics.analyzeVoids(cleanVoids);

                      this.setPipelineWaterfallStep("step-diag", "pass");

                      setTimeout(() => {
                        try {
                          if (typeof Evaluation === 'undefined') {
                            throw new Error("Evaluation Engine is not loaded.");
                          }
                          // Evaluate severity/confidence splits
                          const output = Evaluation.evaluate(this.state.diagnostics, this.state.qualityMetrics);
                          
                          this.state.auditSummary.healthScore = output.healthScore;
                          this.state.auditSummary.weeklySavings = output.totalWeeklySavings;
                          this.state.auditSummary.annualSavings = output.totalAnnualSavings;
                          this.state.auditSummary.recommendations = output.recommendations;

                          this.setPipelineWaterfallStep("step-eval", "pass");

                          // Finalise stats benchmarks
                          const endTime = performance.now();
                          const totalRows = cleanSales.length + cleanLabor.length + cleanVoids.length;
                          this.state.benchmarks = {
                            parseTimeMs: Math.round((endTime - startTime) * 100) / 100,
                            rowsProcessed: totalRows,
                            matchAccuracy: 100 - this.state.qualityMetrics.missingFieldsPercent,
                            headerSuccess: this.state.qualityMetrics.headerMatchConfidence
                          };

                          this.addLog("success", `System audit finalized: Health ${output.healthScore}/100. Recovery opportunity: $${output.totalAnnualSavings.toLocaleString()}/yr.`);
                          this.renderAll();
                        } catch (err) {
                          this.handleIngestError(err);
                        }
                      }, 100);
                    } catch (err) {
                      this.handleIngestError(err);
                    }
                  }, 100);
                } catch (err) {
                  this.handleIngestError(err);
                }
              }, 100);
            } catch (err) {
              this.handleIngestError(err);
            }
          }, 100);
        } catch(err) {
          this.handleIngestError(err);
        }
      }, 100);
    }, 100);
  },

  /**
   * Catches errors in pipeline execution
   */
  handleIngestError(err) {
    if (err.name === "MappingError") {
      this.setPipelineWaterfallStep("step-header", "fail");
      this.addLog("error", `Ingestion stalled: Ambiguous headers found. Triggering user mapping prompt.`);
      this.promptHeaderMapping(err);
    } else {
      this.setPipelineWaterfallStatus("fail");
      this.addLog("error", `System crash: ${err.message}`);
      this.renderLogsOnly();
    }
  },

  /**
   * Interactive Prompt Header Wizard popup mapping loader
   */
  promptHeaderMapping(error) {
    const wizard = document.getElementById("header-mapping-wizard");
    const label = document.getElementById("wizard-prompt-label");
    const select = document.getElementById("wizard-select-column");
    const applyBtn = document.getElementById("btn-apply-wizard-map");

    if (!wizard || !label || !select || !applyBtn) return;

    wizard.classList.remove("hidden");
    this.switchTab("import"); // Bring tab to front

    const missingKey = error.missingKeys[0];
    const schema = error.schemaType;

    label.textContent = `Column mapping required: Identify standard field "${missingKey}" in your raw "${schema}" file:`;
    
    // Load select options with raw headers
    select.innerHTML = error.rawHeaders.map(h => `<option value="${h}">${h}</option>`).join("");

    // Bind apply handler once
    applyBtn.onclick = () => {
      const selectedCol = select.value;
      if (!this.state.manualOverrides[schema]) {
        this.state.manualOverrides[schema] = {};
      }
      this.state.manualOverrides[schema][missingKey] = selectedCol;
      this.addLog("success", `Resolved manual mapping: "${selectedCol}" ➔ "${missingKey}"`);
      wizard.classList.add("hidden");
      this.runAuditPipeline(); // Restart Ingestion
    };
  },

  /**
   * Force simulated MappingError to demonstrate Human-in-the-loop wizard
   */
  simulateHeaderError() {
    this.state.logs = [];
    this.addLog("info", "Simulating ambiguous headers file load (Manual Mapping wizard demo)...");
    
    // Inject invalid header columns in text areas (Net_Revenue changed to 'Gross_Volume_Ambiguous')
    const badSalesMix = samples.bistro.salesMix.replace("net_revenue_total", "gross_volume_ambiguous");
    
    document.getElementById("csv-sales-mix").value = badSalesMix;
    this.state.rawSalesMix = badSalesMix;

    this.runAuditPipeline();
  },

  setPipelineWaterfallStatus(status) {
    const steps = ["step-parse", "step-header", "step-dedup", "step-validate", "step-diag", "step-eval"];
    steps.forEach(s => {
      const el = document.getElementById(s);
      if (!el) return;
      el.className = "waterfall-step";
      if (status === "loading") el.classList.add("waterfall-loading");
      else if (status === "fail") el.classList.add("waterfall-fail");
    });
  },

  setPipelineWaterfallStep(stepId, status) {
    const el = document.getElementById(stepId);
    if (!el) return;
    el.className = "waterfall-step";
    el.classList.add(status === "pass" ? "waterfall-pass" : "waterfall-fail");
  },

  /**
   * Renders browser test runner logs
   */
  runSystemTests() {
    try {
      if (typeof BrowserTestRunner === 'undefined') {
        this.addLog("warn", "System Test Suite (BrowserTestRunner) is not defined. Skipping test suite verification.");
        return;
      }
      const results = BrowserTestRunner.runAll();
      const testConsole = document.getElementById("tests-console");
      if (!testConsole) return;

      testConsole.innerHTML = results.map(r => {
        let colorClass = "text-info";
        let prefix = "[INFO]";
        if (r.type === "pass") { colorClass = "text-success"; prefix = "[PASS]"; }
        else if (r.type === "success") { colorClass = "text-success"; prefix = "[SUCCESS]"; }
        else if (r.type === "fail") { colorClass = "text-danger"; prefix = "[FAIL]"; }

        return `<div class="log-row ${colorClass}">
          <span class="log-prefix">${prefix}</span>
          <span class="log-message">${r.text}</span>
        </div>`;
      }).join("");
    } catch (err) {
      this.addLog("error", `System test execution crashed: ${err.message}`);
    }
  },

  /**
   * Helper to trigger a file download in the browser
   */
  downloadFile(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /**
   * Exports the entire compiled audit state as JSON
   */
  exportAuditJSON() {
    if (!this.state.diagnostics.salesMix) {
      this.addLog("warn", "Cannot export JSON: No active audit data.");
      return;
    }
    const exportData = {
      restaurant: samples[this.state.activePreset].name,
      analysisDate: new Date().toISOString(),
      qualityMetrics: this.state.qualityMetrics,
      auditSummary: this.state.auditSummary,
      benchmarks: this.state.benchmarks,
      diagnostics: this.state.diagnostics
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const fileName = `signal-audit-${this.state.activePreset}-${new Date().toISOString().split('T')[0]}.json`;
    this.downloadFile(jsonStr, fileName, "application/json");
    this.addLog("success", `Exported audit logs to JSON: "${fileName}"`);
  },

  /**
   * Exports the findings list as a Markdown audit report
   */
  exportFindingsMD() {
    if (!this.state.diagnostics.salesMix) {
      this.addLog("warn", "Cannot export findings: No active audit data.");
      return;
    }
    const dataset = samples[this.state.activePreset];
    let md = `# SIGNAL DIAGNOSTIC AUDIT REPORT\n\n`;
    md += `**Restaurant:** ${dataset.name}\n`;
    md += `**Date of Analysis:** ${new Date().toLocaleDateString()}\n`;
    md += `**Overall System Health Score:** ${this.state.auditSummary.healthScore}/100\n`;
    md += `**Data Quality Audit Grade:** ${this.state.qualityMetrics.overallScore}/100\n`;
    md += `**Estimated Annual Savings Opportunity:** $${this.state.auditSummary.annualSavings.toLocaleString()}\n\n`;
    md += `## Top Findings\n\n`;

    if (this.state.auditSummary.recommendations.length === 0) {
      md += `* No critical operational anomalies identified in this run.\n`;
    } else {
      this.state.auditSummary.recommendations.forEach((rec, idx) => {
        md += `### ${idx + 1}. ${rec.title} (${rec.ruleId})\n`;
        md += `- **Category:** ${rec.category}\n`;
        md += `- **Severity:** ${rec.severityBreakdown.total}/15 | **Confidence:** ${rec.confidenceBreakdown.total}/5 (${rec.confidenceBreakdown.label})\n`;
        md += `- **Description:** ${rec.description}\n`;
        md += `- **Evidence:** Observed ${rec.explainStats.observed} (Target baseline: ${rec.explainStats.baseline})\n`;
        md += `- **Action Protocol:** ${rec.actionPlan}\n`;
        md += `- **Target Recovery Opportunity:** $${rec.estWeeklySavings.toFixed(2)}/wk ($${rec.estAnnualSavings.toLocaleString()}/yr)\n\n`;
      });
    }

    md += `---\n*Report generated locally by Signal: Ingestion & Evaluation Framework. Zero server storage transfer.*`;
    
    const fileName = `signal-findings-${this.state.activePreset}-${new Date().toISOString().split('T')[0]}.md`;
    this.downloadFile(md, fileName, "text/markdown");
    this.addLog("success", `Exported findings report to Markdown: "${fileName}"`);
  },

  /**
   * DOM renderer
   */
  renderAll() {
    this.renderKPIs();
    this.renderLogsConsole();
    this.renderDataQualityCard();
    this.renderRecommendations();
    this.renderCharts();
    this.renderDetailTables();
    this.renderSchemaVisualizer();
    this.updateClientReportHeader();
  },

  updateClientReportHeader() {
    const title = document.getElementById("report-title-location");
    if (title) {
      const dataset = samples[this.state.activePreset];
      title.textContent = `Client: ${dataset.name}`;
    }
  },

  renderKPIs() {
    // Health Score
    document.getElementById("kpi-health-score").textContent = `${this.state.auditSummary.healthScore}/100`;
    
    const scoreCard = document.getElementById("health-card");
    scoreCard.className = "kpi-card";
    if (this.state.auditSummary.healthScore >= 80) scoreCard.classList.add("border-success");
    else if (this.state.auditSummary.healthScore >= 60) scoreCard.classList.add("border-warning");
    else scoreCard.classList.add("border-danger");

    // Savings
    document.getElementById("kpi-savings").textContent = `$${this.state.auditSummary.annualSavings.toLocaleString()}`;

    // Prime Cost / SPLH
    if (this.state.diagnostics.salesMix && this.state.diagnostics.labor) {
      const salesMixSum = this.state.diagnostics.salesMix.summary;
      const laborSum = this.state.diagnostics.labor.summary;

      const blendedLabor = laborSum.blendedLaborPercent;
      const cogsPercent = salesMixSum.cogsPercent;
      const primeCost = blendedLabor + cogsPercent;

      document.getElementById("kpi-prime-cost").textContent = `${primeCost.toFixed(1)}%`;
      document.getElementById("kpi-splh").textContent = `$${laborSum.averageSPLH.toFixed(2)}`;
    }
  },

  renderDataQualityCard() {
    const scoreBadge = document.getElementById("dq-overall-score");
    const q = this.state.qualityMetrics;
    
    if (scoreBadge) {
      scoreBadge.textContent = `${q.overallScore}/100`;
      scoreBadge.className = "quality-badge-val";
      if (q.overallScore >= 90) scoreBadge.classList.add("text-success");
      else if (q.overallScore >= 70) scoreBadge.classList.add("text-warning");
      else scoreBadge.classList.add("text-danger");
    }

    document.getElementById("dq-missing").textContent = `${q.missingFieldsPercent}%`;
    document.getElementById("dq-duplicates").textContent = `${q.duplicateRowsCount}`;
    document.getElementById("dq-invalid").textContent = `${q.invalidNumbersCount}`;
    document.getElementById("dq-header-conf").textContent = `${q.headerMatchConfidence}%`;
    document.getElementById("dq-time-cons").textContent = `${q.timestampConsistency}%`;

    const b = this.state.benchmarks;
    document.getElementById("bm-rows").textContent = `${b.rowsProcessed}`;
    document.getElementById("bm-time").textContent = `${b.parseTimeMs} ms`;
    document.getElementById("bm-acc").textContent = `${b.matchAccuracy}%`;
    document.getElementById("bm-header").textContent = `${b.headerSuccess}%`;
  },

  renderLogsConsole() {
    const consoleEl = document.getElementById("logs-console-stream");
    if (!consoleEl) return;

    consoleEl.innerHTML = this.state.logs.map(log => {
      let colorClass = "text-info";
      let prefix = "[INFO]";
      if (log.type === "success") { colorClass = "text-success"; prefix = "[OK]"; }
      else if (log.type === "warn") { colorClass = "text-warning"; prefix = "[WARN]"; }
      else if (log.type === "error") { colorClass = "text-danger"; prefix = "[ERROR]"; }

      return `<div class="log-row ${colorClass}">
        <span class="log-time">[${log.timestamp}]</span>
        <span class="log-prefix">${prefix}</span>
        <span class="log-message">${log.message}</span>
      </div>`;
    }).join("");
    
    consoleEl.scrollTop = consoleEl.scrollHeight;
  },

  /**
   * Renders recommendations list with expandable details ("Explain this Finding")
   */
  renderRecommendations() {
    const listEl = document.getElementById("recommendations-list");
    if (!listEl) return;

    if (this.state.auditSummary.recommendations.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No critical operational anomalies identified in this run.</div>`;
      return;
    }

    listEl.innerHTML = this.state.auditSummary.recommendations.map((rec, idx) => {
      const s = rec.severityBreakdown;
      const c = rec.confidenceBreakdown;
      
      let severityClass = "badge-danger";
      if (s.total < 8) severityClass = "badge-success";
      else if (s.total < 12) severityClass = "badge-warning";

      let confidenceClass = "badge-success";
      if (c.label === "Medium") confidenceClass = "badge-warning";
      else if (c.label === "Low") confidenceClass = "badge-danger";

      const ck = c.checklist;

      return `<div class="anomaly-card">
        <div class="anomaly-header">
          <div class="anomaly-meta">
            <span class="category-tag">${rec.ruleId}: ${rec.category}</span>
            <div style="display: flex; gap: 0.5rem;">
              <span class="severity-badge ${severityClass}">Severity: ${s.total}/15</span>
              <span class="severity-badge ${confidenceClass}">Confidence: ${c.total}/5 (${c.label})</span>
            </div>
          </div>
          <h4 class="anomaly-title">${rec.title}</h4>
        </div>
        <p class="anomaly-desc">${rec.description}</p>

        <!-- Explain this Finding Trigger -->
        <div class="explain-accordion">
          <button class="btn-accordion-toggle" onclick="App.toggleExplainDrawer('explain-${idx}')">
            <span>🔍 Explain this Finding</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          <div id="explain-${idx}" class="explain-drawer hidden">
            <div class="explain-drawer-content">
              
              <div class="explain-split">
                <div class="explain-stats-side">
                  <h5>Mathematical Evidence</h5>
                  <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin-top: 0.4rem;">
                    <div><span class="text-light">Observed:</span> <strong>${rec.explainStats.observed}</strong></div>
                    <div><span class="text-light">Baseline / Target:</span> <strong>${rec.explainStats.baseline}</strong></div>
                    <div><span class="text-light">Deviation:</span> <strong style="color: var(--danger);">${rec.explainStats.deviation}</strong></div>
                    <div><span class="text-light">Operational Cutoff:</span> <strong>${rec.explainStats.threshold}</strong></div>
                  </div>
                </div>
                
                <div class="explain-checklist-side">
                  <h5>Confidence Checklist</h5>
                  <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; margin-top: 0.4rem;">
                    <div>${ck.completeData ? "✓" : "✗"} Data Completeness Check</div>
                    <div>${ck.stablePattern ? "✓" : "✗"} Metric Stability Check</div>
                    <div>${ck.timeSpan ? "✓" : "✗"} Time Span Coverage</div>
                    <div>${ck.crossVal ? "✓" : "✗"} Cross-Validation Correlation</div>
                  </div>
                </div>
              </div>

              <div class="triggered-rules-box" style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dotted var(--border-color);">
                <span class="text-light" style="font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">Triggered Grader Rules:</span>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                  ${rec.explainStats.rulesTriggered.map(r => `<span class="rule-badge">${r}</span>`).join("")}
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <div class="severity-breakdown-grid" style="grid-template-columns: repeat(6, 1fr); margin-top: 0.5rem;">
          <div class="breakdown-stat">
            <span class="stat-label">Financial</span>
            <span class="stat-value">${s.financial}/5</span>
          </div>
          <div class="breakdown-stat">
            <span class="stat-label">Frequency</span>
            <span class="stat-value">${s.frequency}/5</span>
          </div>
          <div class="breakdown-stat">
            <span class="stat-label">Ops Risk</span>
            <span class="stat-value">${s.risk}/5</span>
          </div>
          <div class="breakdown-stat">
            <span class="stat-label">Completeness</span>
            <span class="stat-value">${c.completeness}/5</span>
          </div>
          <div class="breakdown-stat">
            <span class="stat-label">Stability</span>
            <span class="stat-value">${c.stability}/5</span>
          </div>
          <div class="breakdown-stat" style="border-right: none;">
            <span class="stat-label">Quality</span>
            <span class="stat-value">${c.quality}/5</span>
          </div>
        </div>

        <div class="remediation-block">
          <h5>Action Protocol</h5>
          <p>${rec.actionPlan}</p>
        </div>

        <div class="opportunity-savings">
          <span>Target Opportunity Savings:</span>
          <strong>$${rec.estWeeklySavings.toFixed(2)}/wk ($${rec.estAnnualSavings.toLocaleString()}/yr)</strong>
        </div>
      </div>`;
    }).join("");
  },

  /**
   * Toggles detail drawer accordion
   */
  toggleExplainDrawer(drawerId) {
    const el = document.getElementById(drawerId);
    if (!el) return;
    el.classList.toggle("hidden");
    
    // Toggle rotate arrow in button
    const btn = el.previousElementSibling;
    const svg = btn.querySelector("svg");
    if (svg) {
      if (el.classList.contains("hidden")) svg.style.transform = "rotate(0deg)";
      else svg.style.transform = "rotate(180deg)";
    }
  },

  renderCharts() {
    if (typeof Charts === 'undefined') {
      this.addLog("warn", "Visualizations module (Charts) not loaded. Skipping charts rendering.");
      return;
    }
    if (this.state.diagnostics.labor) {
      Charts.renderLabor("chart-labor", this.state.diagnostics.labor.intervals);
    }
    if (this.state.diagnostics.salesMix) {
      const mix = this.state.diagnostics.salesMix;
      Charts.renderMenu("chart-menu", mix.items, mix.summary.averageCM, mix.summary.popularityThresholdPercent);
    }
    if (this.state.diagnostics.voids) {
      const v = this.state.diagnostics.voids;
      Charts.renderVoids("chart-voids", v.servers, v.summary.averageVoidPercent);
    }
  },

  renderDetailTables() {
    const salesBody = document.getElementById("table-sales-body");
    if (salesBody && this.state.diagnostics.salesMix) {
      salesBody.innerHTML = this.state.diagnostics.salesMix.items.map(item => {
        let classBadge = "badge-success";
        if (item.classification === "Dog") classBadge = "badge-danger";
        else if (item.classification === "Puzzle") classBadge = "badge-info";
        else if (item.classification === "Workhorse") classBadge = "badge-warning";

        return `<tr>
          <td>${item.itemName}</td>
          <td>${item.category}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>$${item.itemCost.toFixed(2)}</td>
          <td>$${item.contributionMargin.toFixed(2)}</td>
          <td>${item.salesMixPercent.toFixed(1)}%</td>
          <td><span class="badge ${classBadge}">${item.classification}</span></td>
        </tr>`;
      }).join("");
    }

    const laborBody = document.getElementById("table-labor-body");
    if (laborBody && this.state.diagnostics.labor) {
      laborBody.innerHTML = this.state.diagnostics.labor.intervals.map(hr => {
        const timePart = hr.timestamp.replace("T", " ");
        const leakageLabel = hr.isLeakage ? `<span class="badge badge-danger">Leakage</span>` : `<span class="badge badge-success">Aligned</span>`;
        return `<tr>
          <td>${timePart}</td>
          <td>$${hr.sales.toFixed(2)}</td>
          <td>${hr.laborHours.toFixed(1)}h</td>
          <td>$${hr.laborCost.toFixed(2)}</td>
          <td>${hr.laborPercent.toFixed(1)}%</td>
          <td>$${hr.splh.toFixed(2)}</td>
          <td>${leakageLabel}</td>
        </tr>`;
      }).join("");
    }

    const voidsBody = document.getElementById("table-voids-body");
    if (voidsBody && this.state.diagnostics.voids) {
      voidsBody.innerHTML = this.state.diagnostics.voids.servers.map(srv => {
        const flagLabel = srv.isAnomaly ? `<span class="badge badge-danger">Anomaly Outlier</span>` : `<span class="badge badge-success">Within Bounds</span>`;
        return `<tr>
          <td>${srv.serverName}</td>
          <td>$${srv.netSales.toFixed(2)}</td>
          <td>$${srv.voidAmount.toFixed(2)}</td>
          <td>${srv.voidPercent.toFixed(2)}%</td>
          <td>${srv.zScore.toFixed(2)}</td>
          <td>${flagLabel}</td>
        </tr>`;
      }).join("");
    }
  },

  renderSchemaVisualizer() {
    const rawEl = document.getElementById("schema-raw-sample");
    const normEl = document.getElementById("schema-normalized-sample");
    if (!rawEl || !normEl) return;

    if (this.state.diagnostics.salesMix && this.state.diagnostics.salesMix.items.length > 0) {
      const sampleItem = this.state.diagnostics.salesMix.items[0];
      
      // Pull raw row from state raw text (match first line item)
      const lines = this.state.rawSalesMix.split("\n");
      const rawHeader = lines[0];
      const rawMatch = lines.find(l => l.includes(sampleItem.itemName));
      
      rawEl.textContent = `${rawHeader}\n${rawMatch || ""}`;
      normEl.textContent = JSON.stringify(sampleItem, null, 2);
    }
  }
};

// Expose App to window for inline HTML handlers
window.App = App;

// Start application when page loads (handling cases where DOMContentLoaded has already fired)
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}

import type { ResearchDataset } from "./types";

export interface DashboardThemeSpec {
  headline: string;
  tagline: string;
  primaryAccent: string;
  secondaryAccent: string;
  layoutFocus: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForScript(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function renderInteractiveDashboardHtml(
  dataset: ResearchDataset,
  spec: DashboardThemeSpec
): string {
  const primary = spec.primaryAccent || "#f59e0b";
  const secondary = spec.secondaryAccent || "#38bdf8";
  const embeddedData = safeJsonForScript(dataset);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(spec.headline)} — DiyaPulse A2A Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #090b10;
      --surface: #111520;
      --surface-2: #171c2b;
      --border: rgba(255, 255, 255, 0.09);
      --text: #f3f4f6;
      --muted: #9ca3af;
      --primary: ${escapeHtml(primary)};
      --secondary: ${escapeHtml(secondary)};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
      background:
        radial-gradient(900px 420px at 10% -10%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 60%),
        radial-gradient(700px 360px at 95% 0%, color-mix(in srgb, var(--secondary) 14%, transparent), transparent 55%),
        var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
      min-height: 100vh;
    }
    .container { max-width: 1180px; margin: 0 auto; }
    .ribbon {
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      margin-bottom: 14px; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .pill {
      padding: 4px 10px; border-radius: 999px;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: #e5e7eb;
    }
    .pill-gold {
      background: color-mix(in srgb, var(--primary) 16%, transparent);
      border-color: color-mix(in srgb, var(--primary) 45%, transparent);
      color: #fde68a;
    }
    header {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
      gap: 16px; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 22px;
    }
    h1 { font-size: clamp(1.5rem, 3vw, 2.15rem); font-weight: 700; letter-spacing: -0.02em; }
    .tagline { color: var(--muted); font-size: 14px; margin-top: 6px; max-width: 720px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600;
      padding: 8px 13px; border-radius: 10px; border: 1px solid var(--border);
      background: var(--surface-2); color: var(--text); transition: all 0.15s ease;
    }
    button:hover { border-color: var(--primary); transform: translateY(-1px); }
    button.primary-btn {
      background: var(--primary); color: #090b10; border-color: transparent;
    }
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px; margin-bottom: 22px;
    }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 18px;
    }
    .kpi-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 26px; font-weight: 700; margin: 6px 0 4px; color: #fff; }
    .kpi-detail { font-size: 12px; color: var(--muted); }
    .summary-box {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.09), rgba(56, 189, 248, 0.06));
      border: 1px solid rgba(245, 158, 11, 0.24);
      border-radius: 16px; padding: 18px 20px; margin-bottom: 22px;
    }
    .summary-box h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #fcd34d; margin-bottom: 6px; }
    .summary-box p { font-size: 14.5px; color: #e5e7eb; }
    .charts-grid {
      display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; margin-bottom: 22px;
    }
    @media (max-width: 860px) { .charts-grid { grid-template-columns: 1fr; } }
    .card-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .card-sub { font-size: 12px; color: var(--muted); font-weight: 400; }
    .chart-wrap { position: relative; height: 270px; }
    .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
    @media (max-width: 860px) { .insights-grid { grid-template-columns: 1fr; } }
    ul.clean { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    ul.clean li {
      font-size: 13.5px; color: #d1d5db; padding-left: 14px; position: relative;
    }
    ul.clean li::before {
      content: ""; position: absolute; left: 0; top: 8px; width: 6px; height: 6px;
      border-radius: 50%; background: var(--primary);
    }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      justify-content: space-between; margin-bottom: 14px;
    }
    .search-input {
      background: var(--surface-2); border: 1px solid var(--border); color: var(--text);
      padding: 8px 12px; border-radius: 10px; font-size: 13px; min-width: 240px; flex: 1;
      outline: none;
    }
    .search-input:focus { border-color: var(--primary); }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip {
      padding: 6px 11px; border-radius: 999px; font-size: 12px;
      background: var(--surface-2); border: 1px solid var(--border); color: var(--muted);
    }
    .chip.active { background: var(--primary); color: #090b10; border-color: transparent; font-weight: 700; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--muted); border-bottom: 1px solid var(--border);
      cursor: pointer; user-select: none;
    }
    td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
    tr:hover td { background: rgba(255,255,255,0.025); }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600; background: rgba(56, 189, 248, 0.14); color: #7dd3fc;
    }
    .badge-GitHub { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; }
    .badge-Hacker { background: rgba(245, 158, 11, 0.16); color: #fcd34d; }
    .badge-arXiv { background: rgba(168, 85, 247, 0.16); color: #d8b4fe; }
    .badge-Wikipedia { background: rgba(56, 189, 248, 0.16); color: #7dd3fc; }
    .score-bar {
      width: 72px; height: 7px; background: rgba(255,255,255,0.09); border-radius: 999px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 6px;
    }
    .score-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); }
    a.ext { color: #fde68a; text-decoration: none; font-weight: 600; }
    a.ext:hover { text-decoration: underline; }
    footer { margin-top: 26px; text-align: center; font-size: 12px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <div class="ribbon">
      <span class="pill pill-gold">DiyaPulse A2A Generated App</span>
      <span class="pill">Data Agent: ${escapeHtml(dataset.provenance.dataEngine.toUpperCase())}</span>
      <span class="pill">Builder Harness: AdaL</span>
      <span class="pill">Handoff: BAND Room</span>
      <span class="pill">Skills: Finch SKILL.md</span>
      <span class="pill">Updated: ${escapeHtml(dataset.generatedAt.slice(0, 16).replace("T", " "))} UTC</span>
    </div>

    <header>
      <div>
        <h1>${escapeHtml(spec.headline)}</h1>
        <p class="tagline">${escapeHtml(spec.tagline)}</p>
      </div>
      <div class="actions">
        <button id="btn-csv">Export CSV</button>
        <button id="btn-json" class="primary-btn">Download JSON</button>
      </div>
    </header>

    <section class="summary-box">
      <h2>Executive Intelligence Brief</h2>
      <p id="exec-summary"></p>
    </section>

    <section class="kpi-grid" id="kpi-grid"></section>

    <section class="charts-grid">
      <div class="card">
        <div class="card-title">
          <span>Top Signals by Momentum Score</span>
          <span class="card-sub">Normalized 0–100 index</span>
        </div>
        <div class="chart-wrap"><canvas id="barChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">
          <span>Signal Source Distribution</span>
          <span class="card-sub">Live web provenance</span>
        </div>
        <div class="chart-wrap"><canvas id="doughnutChart"></canvas></div>
      </div>
    </section>

    <section class="insights-grid">
      <div class="card">
        <div class="card-title"><span>Key Research Insights</span><span class="card-sub">Data Agent</span></div>
        <ul class="clean" id="insights-list"></ul>
      </div>
      <div class="card">
        <div class="card-title"><span>Builder Recommendations</span><span class="card-sub">Action Plan</span></div>
        <ul class="clean" id="recs-list"></ul>
      </div>
    </section>

    <section class="card">
      <div class="card-title">
        <span>Interactive Signal Explorer</span>
        <span class="card-sub" id="row-count"></span>
      </div>
      <div class="toolbar">
        <input id="search-input" class="search-input" type="search" placeholder="Filter by title, repo, language, summary..." />
        <div class="chips" id="source-chips"></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th data-sort="name">Signal & Summary</th>
              <th data-sort="source">Source</th>
              <th data-sort="metricValue">Live Metric</th>
              <th data-sort="score">Momentum ↓</th>
              <th data-sort="date">Date</th>
            </tr>
          </thead>
          <tbody id="signals-tbody"></tbody>
        </table>
      </div>
    </section>

    <footer>
      Built autonomously by DiyaPulse A2A · Data Agent → BAND → Builder Agent (AdaL + Finch Skills) → Agent37 Sandbox
    </footer>
  </div>

  <script>
    const DATA = ${embeddedData};
    let activeSource = "All";
    let searchQuery = "";
    let sortKey = "score";
    let sortDir = -1;

    function esc(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    document.getElementById("exec-summary").textContent = DATA.executiveSummary;

    const kpiGrid = document.getElementById("kpi-grid");
    kpiGrid.innerHTML = DATA.kpis.map((k) =>
      '<div class="card">' +
        '<div class="kpi-label">' + esc(k.label) + '</div>' +
        '<div class="kpi-value">' + esc(k.value) + '</div>' +
        '<div class="kpi-detail">' + esc(k.detail) + '</div>' +
      '</div>'
    ).join("");

    document.getElementById("insights-list").innerHTML = DATA.insights.map((i) => '<li>' + esc(i) + '</li>').join("");
    document.getElementById("recs-list").innerHTML = DATA.recommendations.map((r) => '<li>' + esc(r) + '</li>').join("");

    const sources = ["All", ...Array.from(new Set(DATA.signals.map((s) => s.source)))];
    const chipsEl = document.getElementById("source-chips");

    function renderChips() {
      chipsEl.innerHTML = sources.map((src) =>
        '<button class="chip ' + (src === activeSource ? 'active' : '') + '" data-src="' + esc(src) + '">' + esc(src) + '</button>'
      ).join("");
      chipsEl.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeSource = btn.dataset.src;
          renderChips();
          renderTable();
        });
      });
    }

    function renderTable() {
      const q = searchQuery.toLowerCase().trim();
      let rows = DATA.signals.filter((s) => {
        if (activeSource !== "All" && s.source !== activeSource) return false;
        if (!q) return true;
        return (s.name + " " + s.summary + " " + s.category + " " + s.source).toLowerCase().includes(q);
      });

      rows.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      });

      document.getElementById("row-count").textContent = rows.length + " of " + DATA.signals.length + " live signals";
      document.getElementById("signals-tbody").innerHTML = rows.map((s) => {
        const cls = "badge badge-" + s.source.split(" ")[0];
        return '<tr>' +
          '<td><a class="ext" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a>' +
          '<div style="color:#9ca3af;font-size:12px;margin-top:4px;">' + esc(s.summary) + '</div></td>' +
          '<td><span class="' + cls + '">' + esc(s.source) + '</span><div style="color:#6b7280;font-size:11px;margin-top:4px;">' + esc(s.category) + '</div></td>' +
          '<td style="white-space:nowrap;font-weight:600;color:#e5e7eb;">' + esc(s.metricFormatted) + '</td>' +
          '<td style="white-space:nowrap;"><span class="score-bar"><span class="score-fill" style="width:' + Math.min(100, s.score) + '%"></span></span><strong>' + s.score + '</strong></td>' +
          '<td style="white-space:nowrap;color:#9ca3af;">' + esc(s.date) + '</td>' +
        '</tr>';
      }).join("");
    }

    document.getElementById("search-input").addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderTable();
    });

    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (sortKey === key) sortDir *= -1;
        else { sortKey = key; sortDir = key === "name" ? 1 : -1; }
        renderTable();
      });
    });

    renderChips();
    renderTable();

    // Charts
    if (window.Chart) {
      const top = DATA.signals.slice(0, 8);
      new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
          labels: top.map((s) => s.name.length > 26 ? s.name.slice(0, 25) + "…" : s.name),
          datasets: [{
            label: "Momentum Score",
            data: top.map((s) => s.score),
            backgroundColor: "rgba(245, 158, 11, 0.78)",
            borderColor: "#fbbf24",
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { min: 0, max: 100, grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#9ca3af" } },
            y: { grid: { display: false }, ticks: { color: "#e5e7eb", font: { size: 11 } } }
          }
        }
      });

      new Chart(document.getElementById("doughnutChart"), {
        type: "doughnut",
        data: {
          labels: DATA.sourceBreakdown.map((b) => b.label),
          datasets: [{
            data: DATA.sourceBreakdown.map((b) => b.count),
            backgroundColor: ["#10b981", "#f59e0b", "#a855f7", "#38bdf8"],
            borderColor: "#111520",
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: "#e5e7eb", padding: 14 } }
          }
        }
      });
    }

    // Export JSON
    document.getElementById("btn-json").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "diyapulse-research-" + DATA.id + ".json";
      a.click();
    });

    // Export CSV
    document.getElementById("btn-csv").addEventListener("click", () => {
      const cols = ["name", "source", "category", "score", "metricFormatted", "date", "url"];
      const lines = [cols.join(",")].concat(
        DATA.signals.map((s) => cols.map((c) => '"' + String(s[c] ?? "").replace(/"/g, '""') + '"').join(","))
      );
      const blob = new Blob([lines.join("\\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "diyapulse-signals-" + DATA.id + ".csv";
      a.click();
    });
  </script>
</body>
</html>`;
}

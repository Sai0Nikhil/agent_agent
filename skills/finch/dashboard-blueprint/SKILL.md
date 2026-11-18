---
name: dashboard-blueprint
description: Converts a validated ResearchDataset JSON payload into a self-contained, interactive HTML5 research dashboard with Chart.js visualizations, live filtering, KPI cards, and CSV/JSON export.
provider: finch
mcp_endpoint: https://www.finchtech.ai/mcp
version: 1.0.0
---

# Finch Skill: Dashboard Blueprint (`dashboard-blueprint`)

## Purpose
Equip the **Builder Agent** (AdaL harness) with a reusable UI engineering contract so every generated research application is interactive, responsive, XSS-safe, and immediately deployable on **Agent37**.

## Blueprint Components
- Hero brief with provenance ribbon (Data Agent -> BAND -> Builder Agent -> Agent37).
- 4-card KPI telemetry bar.
- Interactive Chart.js Bar Chart (Top Signals by Momentum Score) + Doughnut Chart (Signal Distribution by Source / Category).
- Real-time search input + source filter chips controlling the ranked signal table.
- Client-side **Download JSON** and **Download CSV** exporters.

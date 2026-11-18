---
name: research-dashboard-builder
description: Transforms a structured ResearchDataset JSON from the Data Agent into a production-ready, self-contained interactive research dashboard HTML application and prepares it for Agent37 sandbox deployment.
version: 1.0.0
harness: adal
---

# Research Dashboard Builder Skill (AdaL Harness)

## Objective
Take a structured `ResearchDataset` JSON payload handed off by the **Data Agent** over **BAND** and produce a standalone, interactive, zero-build web application (`index.html`) ready to serve on an **Agent37** sandbox (`~/site` on port `8788`).

## Required Output Contract
Every generated dashboard MUST include:
1. **Executive Header**: Topic title, generation timestamp, live source count, and Data Agent + Builder Agent provenance badges.
2. **KPI Strip**: 4 high-signal quantitative KPI cards derived directly from live data (zero invented metrics).
3. **Interactive Visual Analytics (Chart.js)**:
   - Primary Bar/Horizontal Bar chart comparing top entities by live momentum/popularity score.
   - Secondary Doughnut/Polar chart breaking down ecosystem categories or signal sources (GitHub, Hacker News, arXiv, Wikipedia).
4. **Live Filterable & Searchable Explorer Table**:
   - Instant keyword search input and source/category filter pills.
   - Clickable verified outbound citations for every item.
5. **Key Insights & Strategic Takeaways**:
   - Synthesized bullet insights grounded in the collected signals.
6. **Data Portability Controls**:
   - One-click **Export JSON** and **Export CSV** buttons working purely client-side.

## Visual & Engineering Constraints
- Responsive dark-obsidian editorial aesthetic with subtle Diwali gold/amber accents (`#f59e0b`, `#fbbf24`) and crisp contrast.
- Self-contained single HTML document using CDN Chart.js (with graceful fallback bars if offline) so it deploys reliably to Agent37's `python3 -m http.server 8788 --directory ~/site`.
- Escape all untrusted web strings before rendering into DOM to prevent XSS from scraped web content.

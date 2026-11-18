# DiyaPulse A2A — Autonomous Research-to-App Multi-Agent Studio

Built for the **Diwali Festiverse Agent-to-Agent (A2A) Hackathon (SF Edition 2026)** · Track: **Research — Data & Build**.

Enter any industry, technology, or research topic and watch two autonomous AI agents collaborate in real time:
1. **Data Agent (Lyzr + Finch Skills)** gathers live multi-source web signals (GitHub, Hacker News, arXiv, Wikipedia), synthesizes structured KPIs/insights, and hands off a validated `ResearchDataset` JSON payload in a shared **BAND** room.
2. **Builder Agent (AdaL Harness + Finch Blueprint Skill)** consumes that JSON handoff, builds a self-contained interactive dashboard (Chart.js visualizations, real-time search & filters, CSV/JSON export), and deploys it to an isolated **Agent37** Linux sandbox with a shareable public HTTPS URL.

---

## How All 5 Sponsor Platforms Are Integrated

| Sponsor | Role in DiyaPulse A2A | Implementation Files |
|---|---|---|
| **BAND** (`band.ai`) | Shared A2A collaboration room, agent identity resolution (`/api/v1/agent/me`), atomic room creation (`/api/v1/me/chats`), and `@mention`-routed agent handoffs (`/api/v1/agent/chats/{id}/messages`). | `src/lib/sponsors/band.ts` |
| **Lyzr** (`lyzr.ai`) | Powers the **Data Agent** synthesis layer via Lyzr Agent Studio v3 Inference API (`https://agent-prod.studio.lyzr.ai/v3/inference/chat/`) to distill live web signals into executive insights and recommendations. | `src/lib/sponsors/lyzr.ts` |
| **Finch** (`finchtech.ai`) | Reusable Agent Skills (`live-web-research`, `dataset-normalizer`, `dashboard-blueprint`) authored in Finch's open `SKILL.md` + `references/` format, loaded dynamically at runtime alongside Finch MCP (`https://www.finchtech.ai/mcp`). | `skills/finch/*/SKILL.md`, `src/lib/skills-loader.ts` |
| **AdaL** (`adalagent.ai`) | Automation-first **Builder Agent** harness configured via `AGENTS.md`, `.adal/skills/research-dashboard-builder/SKILL.md`, and `.adal/tools.py` for both web-app orchestration and direct AdaL CLI execution. | `AGENTS.md`, `.adal/skills/`, `.adal/tools.py`, `src/lib/sponsors/adal-builder.ts` |
| **Agent37** (`agent37.com`) | Provisions an isolated `agent37-hermes` cloud Linux sandbox (`POST /v1/instances`), serves the Builder Agent's generated dashboard on port `8788` via `sandbox.agent37.app/v1/instances/{id}/exec`, and publishes a public HTTPS URL (`POST /v1/instances/{id}/public-ports`). | `src/lib/sponsors/agent37.ts` |

---

## Quickstart (Local & 1-Click Vercel Deploy)

### 1. Run Locally
```bash
npm install
cp .env.example .env.local
# Add your BAND, Lyzr, Agent37, and Gemini/OpenAI keys to .env.local
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

> Every sponsor connector automatically runs in **Live Mode** when its API key is configured, and gracefully falls back to local execution/preview when keys are absent — so the demo always works end-to-end.

### 2. Deploy to Vercel (1 Click)
1. Push this repo to GitHub (`https://github.com/Sai0Nikhil/agent_agent`).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Paste your environment variables from `.env.example` into **Vercel Project Settings → Environment Variables**.
4. Click **Deploy** — zero separate backend server required!

### 3. Run Directly in AdaL CLI (Optional)
```bash
curl -fsSL https://adal.sylph.ai/install.sh | bash
adal
```
AdaL automatically detects `AGENTS.md`, `.adal/skills/research-dashboard-builder/SKILL.md`, and `.adal/tools.py`.

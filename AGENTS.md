# DiyaPulse A2A — AdaL Agent Harness Configuration

This repository uses **AdaL** (`adalagent.ai`) as the automation-first harness for the **Builder Agent** in our *Research — Data & Build* multi-agent system.

## Agent Roster & Handoff Protocol

1. **Data Agent (Lyzr + Finch Skills)**
   - Triggered via `@data-agent` in a shared **BAND** room.
   - Executes Finch skills `live-web-research` and `dataset-normalizer`.
   - Emits a validated `ResearchDataset` JSON payload (KPIs, ranked entities, trend series, category breakdowns, executive insights, and verified live URLs).

2. **Builder Agent (AdaL Harness + Finch Blueprint Skill)**
   - Triggered via `@builder-agent` in the same **BAND** room after Data Agent finishes.
   - Loads `.adal/skills/research-dashboard-builder/SKILL.md` and `skills/finch/dashboard-blueprint/SKILL.md`.
   - Transforms the structured `ResearchDataset` into a self-contained, interactive HTML5/Tailwind/Chart.js application with search, filtering, KPI telemetry, interactive charts, and CSV/JSON export.
   - Deploys the generated bundle into an isolated **Agent37** Linux sandbox and publishes a permanent HTTPS preview URL on port `8788`.

## Running with AdaL CLI

```bash
# Install AdaL CLI if not installed
curl -fsSL https://adal.sylph.ai/install.sh | bash

# Launch AdaL inside this workspace (automatically discovers AGENTS.md, .adal/skills, and .adal/tools.py)
adal
```

Use `/skills` inside AdaL to verify `research-dashboard-builder` is active, then ask AdaL to run `run_research_pipeline(topic="AI Coding Agents 2026")` or refine any generated dashboard in `public/generated/`.

# HiDevs Submission Form Reference — DiyaPulse A2A

Copy-ready answers for `https://app.hidevs.xyz/hackathons/diwali-festiverse-a2a-sf-2026`:

- **Track (`problem_statement`)**: `Research — Data & Build`
- **Project Title (`project_title`)**: `DiyaPulse A2A — Autonomous Research-to-App Multi-Agent Studio`
- **GitHub Repository (`github_repo`)**: `https://github.com/Sai0Nikhil/agent_agent`

### Project Description (`description`)
DiyaPulse A2A is a multi-agent Research-to-Build studio built for the Diwali Festiverse A2A Hackathon. Give it any industry topic or technology trend and watch two specialized agents collaborate live over BAND:
1. **Data Agent (Lyzr + Finch Skills)** fans out across live public web APIs (GitHub repositories, Hacker News discussions, arXiv papers, and Wikipedia), normalizes cross-source momentum scores, and synthesizes structured KPIs, insights, and recommendations into a strict `ResearchDataset` JSON contract.
2. **Builder Agent (AdaL Harness + Finch Blueprint Skill)** receives the `@mention` handoff in the BAND room, compiles a self-contained interactive HTML5/Chart.js research dashboard (interactive bar & doughnut charts, live keyword search, source filters, sortable table, and client-side CSV/JSON export), and deploys it inside an isolated **Agent37** Linux sandbox with a live shareable HTTPS preview URL.

### How did you use BAND? (`sponsor_band_usage`)
BAND (`api.band.ai`) serves as our shared Agent-to-Agent collaboration bus (`src/lib/sponsors/band.ts`). Using `BAND_USER_API_KEY` (`band_u_*`) and dedicated agent keys (`BAND_DATA_AGENT_API_KEY`, `BAND_BUILDER_AGENT_API_KEY`), DiyaPulse resolves both agents' identities via `GET /api/v1/agent/me`, atomically creates a shared room via `POST /api/v1/me/chats`, and routes structured research handoffs between `@data.agent` and `@builder.agent` using `@mention`-driven `POST /api/v1/agent/chats/{chat_id}/messages` calls—streamed live in the UI with expandable A2A payload inspection and a direct link to the live BAND room.

### How did you use AdaL? (`sponsor_adal_usage`)
AdaL (`adalagent.ai`) powers our Builder Agent harness (`AGENTS.md`, `.adal/skills/research-dashboard-builder/SKILL.md`, `.adal/tools.py`, and `src/lib/sponsors/adal-builder.ts`). We defined a structured `@skills` specification for transforming `ResearchDataset` JSON into XSS-safe, interactive Chart.js web apps and exposed custom Python tools in `.adal/tools.py` so the exact same research-to-build workflow can be triggered either from the deployed web studio or directly inside the AdaL CLI.

### How did you use Finch? (`sponsor_finch_usage`)
Finch (`finchtech.ai`) provides reusable, modular Agent Skills (`skills/finch/live-web-research/SKILL.md`, `skills/finch/dataset-normalizer/SKILL.md`, and `skills/finch/dashboard-blueprint/SKILL.md`, plus `references/sources.md`). Our runtime skill loader (`src/lib/skills-loader.ts`) parses YAML frontmatter and skill instructions from disk, probes Finch's remote MCP endpoint (`https://www.finchtech.ai/mcp`), and injects the active skill contracts into both the Data Agent and Builder Agent prompts for consistent, reproducible outputs.

### How did you use Lyzr? (`sponsor_lyzr_usage`)
Lyzr (`lyzr.ai`) powers our **Data Agent** synthesis engine (`src/lib/sponsors/lyzr.ts`). After collecting raw live web signals from GitHub, Hacker News, arXiv, and Wikipedia, DiyaPulse calls the Lyzr Agent Studio v3 Inference API (`POST https://agent-prod.studio.lyzr.ai/v3/inference/chat/` with `x-api-key`) to distill raw signals into grounded executive summaries, ranked data-backed insights, and builder recommendations before handing the validated JSON off over BAND.

### How did you use Agent37? (`sponsor_agent37_usage`)
Agent37 (`agent37.com`) provides isolated cloud sandbox execution and instant public hosting for every generated dashboard (`src/lib/sponsors/agent37.ts`). Following Agent37's site-builder pattern, our Builder Agent provisions/reuses an `agent37-hermes` sandbox (`POST /v1/instances`), deploys the compiled HTML bundle into `~/site/index.html` and starts an HTTP server on port `8788` (persisted via `~/.agent37/hooks/post-restart.sh`) using `POST https://sandbox.agent37.app/v1/instances/{id}/exec`, and publishes a permanent unauthenticated HTTPS link (`https://*.agent37.app`) via `POST /v1/instances/{id}/public-ports`.

### What problems did you face during building? (`building_challenges`)
1. **Schema Drift Between Data Agent and Builder Agent**: Free-form LLM prose caused broken charts and inconsistent fields during A2A handoffs. We solved this by introducing Finch's `dataset-normalizer` skill and a strict TypeScript `ResearchDataset` contract with normalized 0–100 momentum scores and verified provenance URLs.
2. **Coordinating Five Distinct Sponsor APIs Under Serverless Constraints**: Keeping BAND room creation, multi-source live web fetching, Lyzr inference, AdaL dashboard compilation, and Agent37 sandbox deployment responsive within a single deployable app required Server-Sent Events (SSE) streaming (`/api/run`), parallel source fan-out with strict per-source timeouts, idempotent Agent37 `409` public-port handling, and clean graceful fallbacks when individual API keys or rate limits are encountered.
3. **XSS Safety in Dynamically Generated Dashboards**: Because the Data Agent ingests live untrusted web titles/descriptions from GitHub and Hacker News, the Builder Agent must strictly sanitize JSON embedded inside `<script>` tags and escape all DOM output inside the generated Agent37 HTML bundle.

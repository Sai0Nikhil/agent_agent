---
name: live-web-research
description: Multi-source live web signal collector for the Data Agent. Queries GitHub repositories, Hacker News discussions, arXiv papers, and Wikipedia summaries to assemble real-time factual signals with provenance URLs.
provider: finch
mcp_endpoint: https://www.finchtech.ai/mcp
version: 1.0.0
---

# Finch Skill: Live Web Research (`live-web-research`)

## Purpose
Provide the **Data Agent** with a repeatable, multi-source web gathering protocol that produces verifiable, timestamped evidence instead of hallucinated summaries.

## Execution Steps
1. **Normalize Query**: Extract core domain keywords and search facets from the user's research brief.
2. **Parallel Source Fan-Out** (see `references/sources.md`):
   - **GitHub Search API**: Top active repositories, star counts, forks, primary languages, and recent activity.
   - **Hacker News Algolia API**: Recent high-signal community threads, point counts, and discussion volume.
   - **arXiv Atom API**: Latest peer-reviewed / preprint research papers, authors, and publication dates.
   - **Wikipedia API**: Authoritative background definitions and canonical domain entities.
3. **Deduplicate & Score**: Compute a normalized momentum score (`0–100`) per signal so downstream agents can rank items reliably.
4. **Emit Provenance**: Attach exact source name, canonical URL, and ISO capture timestamp to every item.

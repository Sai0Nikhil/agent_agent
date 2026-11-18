---
name: dataset-normalizer
description: Normalizes raw multi-source web signals into a strict ResearchDataset JSON contract for A2A handoff over BAND from the Data Agent (Lyzr) to the Builder Agent (AdaL).
provider: finch
mcp_endpoint: https://www.finchtech.ai/mcp
version: 1.0.0
---

# Finch Skill: Dataset Normalizer (`dataset-normalizer`)

## Purpose
Guarantee schema consistency across the Agent-to-Agent handoff so the **Builder Agent** never crashes on malformed or unstructured prose.

## Normalization Rules
1. Produce 4 quantitative KPIs (`label`, `value`, `delta`, `context`) grounded strictly in gathered data.
2. Rank top 8–16 entities with `name`, `source` (`GitHub` | `Hacker News` | `arXiv` | `Wikipedia`), `category`, `score` (`0–100`), `metricLabel`, `metricValue`, `summary`, `url`, and `date`.
3. Compute `sourceBreakdown` and `categoryBreakdown` arrays for visual charts.
4. Generate `insights` (4–5 concise analytical bullets) and `recommendations` (3 concrete actions).
5. Validate every URL starts with `https://` or `http://` and strip control characters.

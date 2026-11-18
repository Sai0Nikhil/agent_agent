import fs from "node:fs";
import path from "node:path";
import type { LoadedSkill } from "./types";

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    }
  }
  return meta;
}

function readSkillFile(relPath: string, provider: "finch" | "adal"): LoadedSkill | null {
  try {
    const absPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) return null;
    const raw = fs.readFileSync(absPath, "utf8");
    const meta = parseFrontmatter(raw);
    const body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
    return {
      name: meta.name || path.basename(path.dirname(relPath)),
      provider,
      version: meta.version || "1.0.0",
      description: meta.description || "Agent skill loaded via SKILL.md",
      path: relPath,
      excerpt: body.slice(0, 420),
    };
  } catch {
    return null;
  }
}

export function loadWorkspaceSkills(): LoadedSkill[] {
  const candidates: Array<{ relPath: string; provider: "finch" | "adal" }> = [
    { relPath: "skills/finch/live-web-research/SKILL.md", provider: "finch" },
    { relPath: "skills/finch/dataset-normalizer/SKILL.md", provider: "finch" },
    { relPath: "skills/finch/dashboard-blueprint/SKILL.md", provider: "finch" },
    { relPath: ".adal/skills/research-dashboard-builder/SKILL.md", provider: "adal" },
  ];

  return candidates
    .map((c) => readSkillFile(c.relPath, c.provider))
    .filter((s): s is LoadedSkill => s !== null);
}

export async function probeFinchMcp(): Promise<{ reachable: boolean; endpoint: string }> {
  const endpoint = process.env.FINCH_MCP_URL || "https://www.finchtech.ai/mcp";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(endpoint, {
      method: "GET",
      headers: process.env.FINCH_A2A_TOKEN
        ? { Authorization: `Bearer ${process.env.FINCH_A2A_TOKEN}` }
        : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    // MCP endpoints commonly respond 200, 401, or 405 on bare GET when live
    return { reachable: res.status > 0 && res.status < 500, endpoint };
  } catch {
    return { reachable: false, endpoint };
  }
}

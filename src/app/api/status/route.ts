import { NextResponse } from "next/server";
import { loadWorkspaceSkills, probeFinchMcp } from "@/lib/skills-loader";
import { isAgent37Configured } from "@/lib/sponsors/agent37";
import { isBandConfigured } from "@/lib/sponsors/band";
import type { SponsorIntegrationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const skills = loadWorkspaceSkills();
  const finchProbe = await probeFinchMcp();

  const bandLive = isBandConfigured();
  const lyzrLive = Boolean(process.env.LYZR_API_KEY && process.env.LYZR_DATA_AGENT_ID);
  const agent37Live = isAgent37Configured();
  const llmLive = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  const finchSkills = skills.filter((s) => s.provider === "finch");
  const adalSkills = skills.filter((s) => s.provider === "adal");

  const sponsors: SponsorIntegrationStatus[] = [
    {
      id: "band",
      name: "BAND",
      role: "A2A Room & @Mention Bus",
      mode: bandLive ? "live" : "fallback",
      detail: bandLive
        ? "Connected to api.band.ai (Human + Data + Builder keys active)"
        : "Local A2A room bus active · Add BAND_* keys for live app.band.ai rooms",
      url: "https://app.band.ai",
      envVars: ["BAND_USER_API_KEY", "BAND_DATA_AGENT_API_KEY", "BAND_BUILDER_AGENT_API_KEY"],
    },
    {
      id: "lyzr",
      name: "Lyzr",
      role: "Data Agent Inference",
      mode: lyzrLive ? "live" : "fallback",
      detail: lyzrLive
        ? "Live Lyzr Agent Studio v3 inference active"
        : "Using live web signals + fallback synthesizer · Add LYZR_* keys for Studio agent",
      url: "https://studio.lyzr.ai",
      envVars: ["LYZR_API_KEY", "LYZR_DATA_AGENT_ID", "LYZR_USER_ID"],
    },
    {
      id: "finch",
      name: "Finch",
      role: "Reusable Agent Skills",
      mode: finchSkills.length > 0 ? (finchProbe.reachable ? "live" : "ready") : "fallback",
      detail: `${finchSkills.length} SKILL.md modules loaded · MCP ${finchProbe.reachable ? "reachable" : "configured"} (${finchProbe.endpoint})`,
      url: "https://www.finchtech.ai",
      envVars: ["FINCH_MCP_URL", "FINCH_A2A_TOKEN"],
    },
    {
      id: "adal",
      name: "AdaL",
      role: "Builder Agent Harness",
      mode: adalSkills.length > 0 ? "live" : "ready",
      detail: `AGENTS.md + ${adalSkills.length} .adal/skills module + .adal/tools.py active`,
      url: "https://adalagent.ai",
      envVars: ["GEMINI_API_KEY (or OPENAI_API_KEY)"],
    },
    {
      id: "agent37",
      name: "Agent37",
      role: "Isolated Sandbox Hosting",
      mode: agent37Live ? "live" : "fallback",
      detail: agent37Live
        ? "Live Agent37 sandbox deployment + public port publishing enabled"
        : "Built-in preview active · Add AGENT37_API_KEY for live https://*.agent37.app URLs",
      url: "https://www.agent37.com",
      envVars: ["AGENT37_API_KEY", "AGENT37_INSTANCE_ID (optional)"],
    },
    {
      id: "llm",
      name: "LLM Engine",
      role: "Synthesis & UI Framing",
      mode: llmLive ? "live" : "fallback",
      detail: process.env.GEMINI_API_KEY
        ? "Gemini 2.5 Flash configured"
        : process.env.OPENAI_API_KEY
        ? "OpenAI gpt-4o-mini configured"
        : "Deterministic live-data mode · Add GEMINI_API_KEY (free tier) for AI synthesis",
      url: "https://aistudio.google.com/apikey",
      envVars: ["GEMINI_API_KEY", "OPENAI_API_KEY"],
    },
  ];

  return NextResponse.json({
    sponsors,
    skills,
    finchMcpReachable: finchProbe.reachable,
  });
}

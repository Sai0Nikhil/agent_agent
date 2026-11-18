import crypto from "node:crypto";
import { renderInteractiveDashboardHtml, type DashboardThemeSpec } from "../dashboard-template";
import { saveDashboardPreview } from "../preview-store";
import type { BuilderResult, LoadedSkill, ResearchDataset } from "../types";
import { deployDashboardToAgent37 } from "./agent37";

async function generateThemeWithLLM(
  dataset: ResearchDataset,
  adalSkill: LoadedSkill | undefined,
  customPrompt?: string
): Promise<{ spec: DashboardThemeSpec; engine: "adal-gemini" | "adal-openai" | "adal-template" }> {
  const defaultSpec: DashboardThemeSpec = {
    headline: `${dataset.topic} — Live Research Intelligence`,
    tagline:
      customPrompt?.trim() ||
      `Interactive data-driven dashboard autonomously assembled from ${dataset.signals.length} live multi-source signals.`,
    primaryAccent: "#f59e0b",
    secondaryAccent: "#38bdf8",
    layoutFocus: "Executive KPIs, Momentum Charts & Live Signal Explorer",
  };

  const prompt = [
    `You are the AdaL Builder Agent executing skill: ${adalSkill?.name || "research-dashboard-builder"}.`,
    `Given the research topic "${dataset.topic}" and executive summary "${dataset.executiveSummary.slice(0, 260)}",`,
    customPrompt ? `User customization directive: "${customPrompt}"` : "",
    `Return ONLY valid JSON: {"headline":"concise punchy dashboard title (<=60 chars)","tagline":"1 sentence value prop (<=140 chars)","primaryAccent":"#hex color (vibrant on dark bg)","secondaryAccent":"#hex color","layoutFocus":"short phrase"}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (process.env.GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(raw) as Partial<DashboardThemeSpec>;
        if (parsed.headline && parsed.tagline) {
          return {
            spec: {
              headline: parsed.headline,
              tagline: parsed.tagline,
              primaryAccent: /^#[0-9a-fA-F]{6}$/.test(parsed.primaryAccent || "")
                ? (parsed.primaryAccent as string)
                : defaultSpec.primaryAccent,
              secondaryAccent: /^#[0-9a-fA-F]{6}$/.test(parsed.secondaryAccent || "")
                ? (parsed.secondaryAccent as string)
                : defaultSpec.secondaryAccent,
              layoutFocus: parsed.layoutFocus || defaultSpec.layoutFocus,
            },
            engine: "adal-gemini",
          };
        }
      }
    } catch {
      // fall through
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = json.choices?.[0]?.message?.content || "";
        const parsed = JSON.parse(raw) as Partial<DashboardThemeSpec>;
        if (parsed.headline && parsed.tagline) {
          return {
            spec: {
              headline: parsed.headline,
              tagline: parsed.tagline,
              primaryAccent: /^#[0-9a-fA-F]{6}$/.test(parsed.primaryAccent || "")
                ? (parsed.primaryAccent as string)
                : defaultSpec.primaryAccent,
              secondaryAccent: /^#[0-9a-fA-F]{6}$/.test(parsed.secondaryAccent || "")
                ? (parsed.secondaryAccent as string)
                : defaultSpec.secondaryAccent,
              layoutFocus: parsed.layoutFocus || defaultSpec.layoutFocus,
            },
            engine: "adal-openai",
          };
        }
      }
    } catch {
      // fall through
    }
  }

  return { spec: defaultSpec, engine: "adal-template" };
}

export async function runAdaLBuilderAgent(params: {
  dataset: ResearchDataset;
  skills: LoadedSkill[];
  customDirective?: string;
}): Promise<BuilderResult> {
  const { dataset, skills, customDirective } = params;
  const adalSkill = skills.find((s) => s.provider === "adal");
  const dashboardId = `app-${crypto.randomBytes(4).toString("hex")}`;

  const { spec, engine } = await generateThemeWithLLM(dataset, adalSkill, customDirective);
  const html = renderInteractiveDashboardHtml(dataset, spec);

  // Save to local preview route so standalone open-in-new-tab works immediately
  saveDashboardPreview(dashboardId, html);

  // Deploy to isolated Agent37 cloud sandbox when AGENT37_API_KEY is configured
  const agent37 = await deployDashboardToAgent37({
    dashboardId,
    topic: dataset.topic,
    html,
  });

  const buildNotes = [
    `Executed AdaL skill "${adalSkill?.name || "research-dashboard-builder"}" + Finch "dashboard-blueprint".`,
    `Compiled standalone HTML5 + Chart.js app with ${dataset.signals.length} interactive signals, live filters, and JSON/CSV export.`,
    agent37.note,
  ];

  return {
    dashboardId,
    title: spec.headline,
    html,
    builderEngine: engine,
    adalSkillUsed: adalSkill?.path || ".adal/skills/research-dashboard-builder/SKILL.md",
    agent37Mode: agent37.mode,
    agent37InstanceId: agent37.instanceId,
    agent37PublicUrl: agent37.publicUrl,
    localPreviewUrl: `/api/preview/${dashboardId}`,
    buildNotes,
  };
}

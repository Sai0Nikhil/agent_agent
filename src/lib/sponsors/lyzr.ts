import crypto from "node:crypto";
import { buildBreakdowns } from "../live-research";
import type { LoadedSkill, ResearchDataset, ResearchSignal } from "../types";

interface SynthesisOutput {
  executiveSummary: string;
  insights: string[];
  recommendations: string[];
  engine: "lyzr" | "gemini" | "openai" | "deterministic";
}

function buildSynthesisPrompt(topic: string, signals: ResearchSignal[], wikiSummary: string, skills: LoadedSkill[]): string {
  const skillNames = skills.map((s) => `${s.provider}:${s.name}`).join(", ");
  const compactSignals = signals.slice(0, 12).map((s) => ({
    name: s.name,
    source: s.source,
    category: s.category,
    score: s.score,
    metric: s.metricFormatted,
    date: s.date,
    summary: s.summary.slice(0, 130),
  }));

  return [
    `You are the Data Agent in an Agent-to-Agent (A2A) Research-to-Build system.`,
    `Active Finch Skills: ${skillNames}.`,
    `Research Topic: "${topic}"`,
    wikiSummary ? `Background context: ${wikiSummary}` : "",
    `Live web signals gathered right now:\n${JSON.stringify(compactSignals, null, 2)}`,
    `Return ONLY valid JSON with this exact schema (no markdown fences):`,
    `{"executiveSummary":"2-3 sentence sharp executive synthesis grounded strictly in the signals above.","insights":["4 specific data-backed insights citing concrete repositories, discussions, or papers from the signals"],"recommendations":["3 concrete builder/product recommendations based on these findings"]}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function parseJsonLoose(text: string): Partial<SynthesisOutput> | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<SynthesisOutput>;
    if (typeof parsed.executiveSummary === "string" && Array.isArray(parsed.insights)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function tryLyzr(prompt: string, topic: string): Promise<SynthesisOutput | null> {
  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_DATA_AGENT_ID;
  const userId = process.env.LYZR_USER_ID || "builder@diyapulse.ai";
  if (!apiKey || !agentId) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);
    const res = await fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: agentId,
        session_id: `diyapulse-${crypto.randomBytes(4).toString("hex")}`,
        message: prompt,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = (await res.json()) as { response?: string; message?: string; output?: string };
    const rawText = data.response || data.message || data.output || "";
    const parsed = parseJsonLoose(rawText);
    if (parsed?.executiveSummary && parsed.insights?.length) {
      return {
        executiveSummary: parsed.executiveSummary,
        insights: parsed.insights.slice(0, 5),
        recommendations: (parsed.recommendations || []).slice(0, 3),
        engine: "lyzr",
      };
    }
    if (rawText.trim().length > 40) {
      return {
        executiveSummary: rawText.trim().slice(0, 420),
        insights: [`Lyzr Data Agent analyzed live multi-source signals for "${topic}".`],
        recommendations: ["Use the structured dataset below to power interactive comparisons and alerts."],
        engine: "lyzr",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryGemini(prompt: string): Promise<SynthesisOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = parseJsonLoose(text);
    if (parsed?.executiveSummary && parsed.insights?.length) {
      return {
        executiveSummary: parsed.executiveSummary,
        insights: parsed.insights.slice(0, 5),
        recommendations: (parsed.recommendations || []).slice(0, 3),
        engine: "gemini",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryOpenAI(prompt: string): Promise<SynthesisOutput | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content || "";
    const parsed = parseJsonLoose(text);
    if (parsed?.executiveSummary && parsed.insights?.length) {
      return {
        executiveSummary: parsed.executiveSummary,
        insights: parsed.insights.slice(0, 5),
        recommendations: (parsed.recommendations || []).slice(0, 3),
        engine: "openai",
      };
    }
    return null;
  } catch {
    return null;
  }
}

function deterministicSynthesis(topic: string, signals: ResearchSignal[], wikiSummary: string): SynthesisOutput {
  const gh = signals.filter((s) => s.source === "GitHub");
  const hn = signals.filter((s) => s.source === "Hacker News");
  const arxiv = signals.filter((s) => s.source === "arXiv");

  const topGh = gh[0];
  const topHn = hn[0];
  const topPaper = arxiv[0];

  const executiveSummary = [
    `Live multi-source intelligence for "${topic}" aggregated ${signals.length} verified signals across GitHub (${gh.length}), Hacker News (${hn.length}), arXiv (${arxiv.length}), and reference sources.`,
    topGh ? `Open-source leadership is anchored by ${topGh.name} (${topGh.metricFormatted}), indicating strong developer adoption.` : "",
    wikiSummary ? wikiSummary.slice(0, 170) : "",
  ]
    .filter(Boolean)
    .join(" ");

  const insights: string[] = [];
  if (topGh) {
    insights.push(
      `Top open-source momentum: ${topGh.name} leads GitHub traction with ${topGh.metricFormatted} in ${topGh.category}.`
    );
  }
  if (topHn) {
    insights.push(
      `Developer community debate centers on "${topHn.name}" (${topHn.metricFormatted}), signaling active practitioner interest.`
    );
  }
  if (topPaper) {
    insights.push(
      `Latest academic R&D: "${topPaper.name}" (${topPaper.date}) highlights active frontier research on arXiv.`
    );
  }
  const languages = Array.from(new Set(gh.map((r) => r.category).filter(Boolean))).slice(0, 3);
  if (languages.length) {
    insights.push(
      `Dominant implementation ecosystems observed across leading repositories: ${languages.join(", ")}.`
    );
  }
  if (!insights.length) {
    insights.push(`Collected live cross-web signals for "${topic}" ready for interactive dashboard visualization.`);
  }

  const recommendations = [
    topGh
      ? `Benchmark against ${topGh.name} and monitor its release cadence as an industry baseline.`
      : `Track emerging open-source tooling in "${topic}" weekly via automated Data Agent sweeps.`,
    topHn
      ? `Address practitioner pain points surfaced in top Hacker News threads like "${topHn.name.slice(0, 65)}".`
      : `Combine community sentiment with repository velocity to spot early inflection points.`,
    `Export this normalized JSON dataset into downstream Builder Agent templates or schedule recurring BAND room updates.`,
  ];

  return {
    executiveSummary,
    insights,
    recommendations,
    engine: "deterministic",
  };
}

export async function synthesizeWithLyzrDataAgent(params: {
  topic: string;
  signals: ResearchSignal[];
  wikipediaSummary: string;
  skills: LoadedSkill[];
}): Promise<ResearchDataset> {
  const { topic, signals, wikipediaSummary, skills } = params;
  const { sourceBreakdown, categoryBreakdown, kpis } = buildBreakdowns(signals);
  const prompt = buildSynthesisPrompt(topic, signals, wikipediaSummary, skills);

  // Priority: Lyzr Agent Studio -> Gemini -> OpenAI -> Deterministic live-data synthesis
  const synthesized =
    (await tryLyzr(prompt, topic)) ||
    (await tryGemini(prompt)) ||
    (await tryOpenAI(prompt)) ||
    deterministicSynthesis(topic, signals, wikipediaSummary);

  return {
    id: `ds-${crypto.randomBytes(4).toString("hex")}`,
    topic,
    generatedAt: new Date().toISOString(),
    executiveSummary: synthesized.executiveSummary,
    kpis,
    signals,
    sourceBreakdown,
    categoryBreakdown,
    insights: synthesized.insights,
    recommendations:
      synthesized.recommendations.length > 0
        ? synthesized.recommendations
        : deterministicSynthesis(topic, signals, wikipediaSummary).recommendations,
    provenance: {
      dataEngine: synthesized.engine,
      skillsLoaded: skills.map((s) => `${s.provider}/${s.name}`),
      totalRawSignals: signals.length,
    },
  };
}

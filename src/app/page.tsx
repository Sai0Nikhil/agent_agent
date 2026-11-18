"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Cpu,
  Database,
  Flame,
  Layers,
  Loader2,
  Monitor,
  Network,
  Sparkles,
} from "lucide-react";
import { A2AConversationFeed } from "@/components/A2AConversationFeed";
import { BuilderPreviewPane } from "@/components/BuilderPreviewPane";
import { ResearchDataView } from "@/components/ResearchDataView";
import { SponsorStatusBar } from "@/components/SponsorStatusBar";
import type {
  BandHandoffMessage,
  BuilderResult,
  LoadedSkill,
  PipelineStreamEvent,
  ResearchDataset,
  SponsorIntegrationStatus,
} from "@/lib/types";

const PRESETS = [
  {
    label: "AI Coding Agents 2026",
    topic: "AI coding agents",
    directive: "Highlight open-source velocity, developer adoption, and architecture trends.",
  },
  {
    label: "Model Context Protocol (MCP)",
    topic: "Model Context Protocol MCP",
    directive: "Compare top MCP servers, frameworks, and community discussions.",
  },
  {
    label: "Agent-to-Agent (A2A) Systems",
    topic: "multi agent A2A orchestration",
    directive: "Focus on inter-agent protocols, sandboxing, and reusable skills.",
  },
  {
    label: "Open-Source Reasoning LLMs",
    topic: "open source reasoning LLM",
    directive: "Track breakthrough repos, arXiv research papers, and benchmark chatter.",
  },
];

const PIPELINE_STEPS = [
  { id: "finch", label: "Finch Skills" },
  { id: "init", label: "BAND Room" },
  { id: "data_gather", label: "Live Research" },
  { id: "lyzr_synthesize", label: "Lyzr Data Agent" },
  { id: "band_handoff", label: "A2A Handoff" },
  { id: "adal_build", label: "AdaL + Agent37" },
] as const;

export default function HomePage() {
  const [topic, setTopic] = useState("AI coding agents");
  const [customDirective, setCustomDirective] = useState("");
  const [sponsors, setSponsors] = useState<SponsorIntegrationStatus[]>([]);
  const [skills, setSkills] = useState<LoadedSkill[]>([]);
  const [finchMcpReachable, setFinchMcpReachable] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [currentStage, setCurrentStage] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | undefined>(undefined);
  const [roomMode, setRoomMode] = useState<"live" | "simulated" | null>(null);
  const [roomNote, setRoomNote] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<BandHandoffMessage[]>([]);
  const [dataset, setDataset] = useState<ResearchDataset | null>(null);
  const [buildResult, setBuildResult] = useState<BuilderResult | null>(null);

  const [activeTab, setActiveTab] = useState<"preview" | "data" | "architecture">("preview");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.sponsors) setSponsors(data.sponsors);
        if (data.skills) setSkills(data.skills);
        if (typeof data.finchMcpReachable === "boolean") {
          setFinchMcpReachable(data.finchMcpReachable);
        }
      })
      .catch(() => {});
  }, []);

  async function runMission(overrideTopic?: string, overrideDirective?: string) {
    const targetTopic = (overrideTopic ?? topic).trim();
    const targetDirective = (overrideDirective ?? customDirective).trim();
    if (!targetTopic || isRunning) return;

    setTopic(targetTopic);
    if (overrideDirective !== undefined) setCustomDirective(overrideDirective);

    setIsRunning(true);
    setError(null);
    setProgress(5);
    setCurrentStage("finch");
    setStageMessage("Initializing multi-agent pipeline...");
    setMessages([]);
    setDataset(null);
    setBuildResult(null);
    setRoomId(null);
    setRoomUrl(undefined);
    setRoomMode(null);
    setRoomNote(undefined);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: targetTopic, customDirective: targetDirective }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Pipeline failed to start (HTTP ${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          const event = JSON.parse(jsonStr) as PipelineStreamEvent;

          if (event.type === "stage") {
            setCurrentStage(event.stage);
            setStageMessage(event.message);
            setProgress(event.progress);
          } else if (event.type === "skills") {
            setSkills(event.skills);
            setFinchMcpReachable(event.finchMcpReachable);
          } else if (event.type === "band_room") {
            setRoomId(event.roomId);
            setRoomUrl(event.roomUrl);
            setRoomMode(event.mode);
            setRoomNote(event.note);
          } else if (event.type === "message") {
            setMessages((prev) => [...prev, event.message]);
          } else if (event.type === "dataset") {
            setDataset(event.dataset);
          } else if (event.type === "build") {
            setBuildResult(event.result);
            setActiveTab("preview");
          } else if (event.type === "error") {
            setError(event.error);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error running A2A pipeline.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 shadow-lg shadow-amber-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">DiyaPulse A2A</h1>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                Research — Data &amp; Build
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Diwali Festiverse A2A Hackathon · Data Agent → BAND → Builder Agent → Agent37
            </p>
          </div>
        </div>

        <SponsorStatusBar sponsors={sponsors} />
      </header>

      {/* Mission Launcher */}
      <section className="mt-5 rounded-2xl border border-white/10 bg-[#0d111b]/90 p-4 shadow-xl sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runMission();
          }}
          className="grid gap-3 lg:grid-cols-[1.4fr_1.1fr_auto]"
        >
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Research Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI coding agents, quantum computing, SF FinTech..."
              className="w-full rounded-xl border border-white/12 bg-[#141927] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Builder Agent Directive (Optional)
            </label>
            <input
              type="text"
              value={customDirective}
              onChange={(e) => setCustomDirective(e.target.value)}
              placeholder="e.g. Focus on developer traction & enterprise readiness"
              className="w-full rounded-xl border border-white/12 bg-[#141927] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-sky-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isRunning || !topic.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running A2A...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Launch A2A Mission
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500">Quick demos:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={isRunning}
              onClick={() => runMission(p.topic, p.directive)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300 transition hover:border-amber-400/50 hover:text-amber-200 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Live Progress Pipeline */}
        {(isRunning || progress > 0) && (
          <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-amber-200">{stageMessage}</span>
              <span className="font-mono text-zinc-400">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {PIPELINE_STEPS.map((step, idx) => {
                const threshold = (idx + 1) * 15;
                const active = currentStage === step.id;
                const done = progress >= threshold && !active;
                return (
                  <div
                    key={step.id}
                    className={`rounded-lg border px-2 py-1 text-center text-[11px] font-medium transition ${
                      active
                        ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                        : done
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/5 bg-white/[0.02] text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
            Error: {error}
          </div>
        )}
      </section>

      {/* Main Split Workspace */}
      <main className="mt-5 grid flex-1 gap-5 lg:grid-cols-[400px_1fr] xl:grid-cols-[430px_1fr]">
        {/* Left: BAND A2A Conversation & Skills */}
        <A2AConversationFeed
          roomId={roomId}
          roomUrl={roomUrl}
          roomMode={roomMode}
          roomNote={roomNote}
          messages={messages}
          skills={skills}
          finchMcpReachable={finchMcpReachable}
          isRunning={isRunning}
        />

        {/* Right: Built Dashboard / Structured Data / Architecture */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d111b]/90 p-4 shadow-xl">
          {/* Tabs */}
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "preview"
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Built App (AdaL → Agent37)
              {buildResult && (
                <span className="ml-1 h-2 w-2 rounded-full bg-emerald-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "data"
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              Structured Data (Lyzr)
              {dataset && (
                <span className="rounded bg-black/25 px-1.5 py-0.2 text-[10px]">
                  {dataset.signals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "architecture"
                  ? "bg-sky-500 text-zinc-950"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              5-Sponsor A2A Architecture
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1">
            {activeTab === "preview" && (
              <BuilderPreviewPane result={buildResult} isRunning={isRunning} />
            )}

            {activeTab === "data" && <ResearchDataView dataset={dataset} />}

            {activeTab === "architecture" && (
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    name: "1. BAND (band.ai)",
                    role: "Shared A2A Room & @Mention Collaboration Bus",
                    desc: "Creates a shared multi-agent room via /api/v1/me/chats, authenticates Data Agent and Builder Agent with individual band_a_* keys, and routes structured research handoffs via @mentions.",
                    icon: Network,
                    color: "text-amber-300 border-amber-500/25 bg-amber-500/[0.05]",
                  },
                  {
                    name: "2. Finch (finchtech.ai)",
                    role: "Reusable Agent Skills (SKILL.md + MCP)",
                    desc: "Packages live-web-research, dataset-normalizer, and dashboard-blueprint in Finch's open SKILL.md + references/ standard, loaded dynamically at runtime and paired with Finch MCP (finchtech.ai/mcp).",
                    icon: Cpu,
                    color: "text-teal-300 border-teal-500/25 bg-teal-500/[0.05]",
                  },
                  {
                    name: "3. Lyzr (lyzr.ai)",
                    role: "Data Agent Synthesis Engine",
                    desc: "Connects to Lyzr Agent Studio v3 Inference API (/v3/inference/chat/) to transform raw multi-source web signals (GitHub, Hacker News, arXiv, Wikipedia) into validated KPIs, insights, and recommendations.",
                    icon: Database,
                    color: "text-violet-300 border-violet-500/25 bg-violet-500/[0.05]",
                  },
                  {
                    name: "4. AdaL (adalagent.ai)",
                    role: "Automation-First Builder Agent Harness",
                    desc: "Ships AGENTS.md, .adal/skills/research-dashboard-builder/SKILL.md, and .adal/tools.py so the Builder Agent compiles structured JSON datasets into interactive Chart.js + filterable HTML5 web apps.",
                    icon: Layers,
                    color: "text-sky-300 border-sky-500/25 bg-sky-500/[0.05]",
                  },
                  {
                    name: "5. Agent37 (agent37.com)",
                    role: "Isolated Cloud Sandbox & Public App Hosting",
                    desc: "Provisions an agent37-hermes Linux sandbox (POST /v1/instances), deploys the generated dashboard via sandbox exec onto port 8788, and publishes a permanent https://*.agent37.app URL via Public Ports API.",
                    icon: Monitor,
                    color: "text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.05]",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className={`rounded-xl border p-4 ${item.color}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                      </div>
                      <p className="mt-1 text-xs font-medium opacity-90">{item.role}</p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

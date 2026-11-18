"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import type { BandHandoffMessage, LoadedSkill } from "@/lib/types";

interface Props {
  roomId: string | null;
  roomUrl?: string;
  roomMode: "live" | "simulated" | null;
  roomNote?: string;
  messages: BandHandoffMessage[];
  skills: LoadedSkill[];
  finchMcpReachable: boolean;
  isRunning: boolean;
}

const BADGE_STYLES: Record<BandHandoffMessage["sponsorBadge"], string> = {
  BAND: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Finch: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  Lyzr: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  AdaL: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Agent37: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export function A2AConversationFeed({
  roomId,
  roomUrl,
  roomMode,
  roomNote,
  messages,
  skills,
  finchMcpReachable,
  isRunning,
}: Props) {
  const [expandedPayload, setExpandedPayload] = useState<Record<string, boolean>>({});
  const [showSkills, setShowSkills] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0d111b]/90 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">BAND A2A Room</h2>
              {roomMode && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    roomMode === "live"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {roomMode === "live" ? "Live BAND Sync" : "Local A2A Bus"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {roomId ? `Room: ${roomId}` : "Awaiting mission launch"}
            </p>
          </div>
        </div>

        {roomUrl && (
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
          >
            Open in BAND
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Finch & AdaL Skills Drawer Toggle */}
      {skills.length > 0 && (
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setShowSkills((v) => !v)}
            className="flex w-full items-center justify-between text-left text-xs text-zinc-300 hover:text-white"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Wrench className="h-3.5 w-3.5 text-teal-400" />
              Active Skills Loaded ({skills.length})
              <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] text-teal-300">
                Finch MCP {finchMcpReachable ? "Online" : "Ready"}
              </span>
            </span>
            {showSkills ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>

          {showSkills && (
            <div className="mt-2.5 space-y-1.5">
              {skills.map((skill) => (
                <div
                  key={skill.path}
                  className="rounded-lg border border-white/8 bg-black/30 px-2.5 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-white">
                      {skill.name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                        skill.provider === "finch"
                          ? "bg-teal-500/20 text-teal-300"
                          : "bg-sky-500/20 text-sky-300"
                      }`}
                    >
                      {skill.provider}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">{skill.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Timeline */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "640px" }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
            <Sparkles className="h-7 w-7 text-amber-400/80" />
            <p className="mt-3 text-sm font-medium text-zinc-200">
              Multi-Agent Collaboration Feed
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Launch any topic above to watch <code className="text-amber-300">@data.agent</code>{" "}
              and <code className="text-sky-300">@builder.agent</code> exchange structured JSON
              findings over BAND.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isHuman = msg.senderRole === "human";
            const isData = msg.senderRole === "data-agent";
            const isExpanded = Boolean(expandedPayload[msg.id]);

            return (
              <div
                key={msg.id}
                className={`rounded-xl border p-3.5 transition ${
                  isHuman
                    ? "border-white/12 bg-white/[0.04]"
                    : isData
                    ? "border-violet-500/25 bg-violet-500/[0.06]"
                    : "border-sky-500/25 bg-sky-500/[0.06]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        isHuman
                          ? "bg-zinc-700 text-zinc-100"
                          : isData
                          ? "bg-violet-500/25 text-violet-300"
                          : "bg-sky-500/25 text-sky-300"
                      }`}
                    >
                      {isHuman ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-xs font-semibold text-white">{msg.senderName}</span>
                    <span className="font-mono text-[11px] text-zinc-400">@{msg.senderHandle}</span>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      BADGE_STYLES[msg.sponsorBadge]
                    }`}
                  >
                    {msg.sponsorBadge}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-200">
                  {msg.content}
                </p>

                {msg.payloadPreview && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPayload((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {isExpanded ? "Hide A2A Payload" : "Inspect Structured A2A Payload"}
                    </button>
                    {isExpanded && (
                      <pre className="mt-1.5 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-2.5 font-mono text-[11px] text-emerald-200">
                        {JSON.stringify(msg.payloadPreview, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Mentions: {msg.mentions.map((m) => `@${m}`).join(", ")}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}

        {isRunning && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-200">
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
            Agents are actively collaborating in the BAND room...
          </div>
        )}
      </div>

      {roomNote && (
        <div className="border-t border-white/10 px-4 py-2 text-[11px] text-zinc-400">
          {roomNote}
        </div>
      )}
    </div>
  );
}

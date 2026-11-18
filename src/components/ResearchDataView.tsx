"use client";

import { useState } from "react";
import { Check, Code2, Copy, Database, ExternalLink, Sparkles } from "lucide-react";
import type { ResearchDataset } from "@/lib/types";

interface Props {
  dataset: ResearchDataset | null;
}

export function ResearchDataView({ dataset }: Props) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d111b]/60 px-6 py-20 text-center">
        <Database className="h-8 w-8 text-violet-400/80" />
        <p className="mt-3 text-sm font-semibold text-white">No Structured Dataset Yet</p>
        <p className="mt-1 max-w-sm text-xs text-zinc-400">
          When you launch a mission, the Data Agent (Lyzr + Finch Skills) will collect live signals
          from GitHub, Hacker News, arXiv, and Wikipedia and display the structured dataset here.
        </p>
      </div>
    );
  }

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(dataset, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 font-semibold text-violet-200">
            Engine: {dataset.provenance.dataEngine.toUpperCase()}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-zinc-300">
            {dataset.signals.length} Verified Live Signals
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-amber-400/50"
          >
            <Code2 className="h-3.5 w-3.5 text-amber-400" />
            {showRawJson ? "Formatted View" : "Raw A2A JSON"}
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-400/50"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
            )}
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      {showRawJson ? (
        <pre className="max-h-[580px] overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-emerald-200">
          {JSON.stringify(dataset, null, 2)}
        </pre>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Executive Synthesis
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-100">
              {dataset.executiveSummary}
            </p>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {dataset.kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-white/10 bg-[#121726] p-3.5"
              >
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">
                  {kpi.label}
                </div>
                <div className="mt-1 text-xl font-bold text-white">{kpi.value}</div>
                <div className="mt-1 text-[11px] text-zinc-400">{kpi.detail}</div>
              </div>
            ))}
          </div>

          {/* Insights & Recommendations */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#121726] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                Key Insights
              </h3>
              <ul className="mt-2.5 space-y-2 text-xs text-zinc-200">
                {dataset.insights.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#121726] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                Recommendations
              </h3>
              <ul className="mt-2.5 space-y-2 text-xs text-zinc-200">
                {dataset.recommendations.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signals List */}
          <div className="rounded-xl border border-white/10 bg-[#121726] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Ranked Live Signals ({dataset.signals.length})
            </h3>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {dataset.signals.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-white/8 bg-black/25 p-2.5"
                >
                  <div className="min-w-0">
                    <a
                      href={sig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:underline"
                    >
                      <span className="truncate">{sig.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">{sig.summary}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
                      {sig.source}
                    </span>
                    <div className="mt-1 text-[11px] font-semibold text-emerald-300">
                      {sig.metricFormatted}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

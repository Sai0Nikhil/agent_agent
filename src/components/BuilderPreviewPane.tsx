"use client";

import { useState } from "react";
import {
  Check,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Monitor,
} from "lucide-react";
import type { BuilderResult } from "@/lib/types";

interface Props {
  result: BuilderResult | null;
  isRunning: boolean;
}

export function BuilderPreviewPane({ result, isRunning }: Props) {
  const [useAgent37Iframe, setUseAgent37Iframe] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d111b]/60 px-6 py-24 text-center">
        <Monitor className="h-9 w-9 text-sky-400/80" />
        <p className="mt-3 text-sm font-semibold text-white">
          {isRunning
            ? "Builder Agent is crafting your interactive dashboard..."
            : "Live Generated Dashboard Preview"}
        </p>
        <p className="mt-1 max-w-md text-xs text-zinc-400">
          Once the Data Agent hands off structured JSON in the BAND room, the AdaL Builder Agent
          will compile a full interactive dashboard (Chart.js visuals, live search/filters, CSV/JSON
          export) and publish it via Agent37.
        </p>
      </div>
    );
  }

  const downloadHtml = () => {
    const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.dashboardId}.html`;
    a.click();
  };

  const copyAgent37Url = async () => {
    const url = result.agent37PublicUrl || `${window.location.origin}${result.localPreviewUrl}`;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const openStandalonePreview = () => {
    if (result.agent37PublicUrl) {
      window.open(result.agent37PublicUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      {/* Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#121726] px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 font-semibold text-sky-200">
            <Layers className="h-3 w-3" />
            AdaL: {result.builderEngine}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
              result.agent37Mode === "live"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            <Cloud className="h-3 w-3" />
            {result.agent37Mode === "live"
              ? `Agent37 Live (${result.agent37InstanceId})`
              : "Agent37 Ready · Instant Preview"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {result.agent37PublicUrl && (
            <button
              type="button"
              onClick={() => setUseAgent37Iframe((v) => !v)}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              {useAgent37Iframe ? "Local Render" : "Load Agent37 URL"}
            </button>
          )}
          <button
            type="button"
            onClick={copyAgent37Url}
            className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:border-amber-400/50"
          >
            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedUrl ? "Copied URL" : "Copy Link"}
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:border-sky-400/50"
          >
            <Download className="h-3.5 w-3.5" />
            HTML
          </button>
          <button
            type="button"
            onClick={openStandalonePreview}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Open Live App
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Interactive Dashboard */}
      <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#090b10] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#111521] px-3.5 py-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="truncate font-mono text-[11px] text-zinc-300">
            {result.agent37PublicUrl || `diyapulse.app${result.localPreviewUrl}`}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-300">Interactive</span>
        </div>

        {useAgent37Iframe && result.agent37PublicUrl ? (
          <iframe
            title={result.title}
            src={result.agent37PublicUrl}
            className="h-[620px] w-full border-0 bg-[#090b10]"
          />
        ) : (
          <iframe
            title={result.title}
            srcDoc={result.html}
            sandbox="allow-scripts allow-downloads allow-popups"
            className="h-[620px] w-full border-0 bg-[#090b10]"
          />
        )}
      </div>

      {/* Build Provenance Notes */}
      <div className="rounded-xl border border-white/8 bg-black/30 px-3.5 py-2.5 text-[11px] text-zinc-400">
        {result.buildNotes.map((note, idx) => (
          <div key={idx}>• {note}</div>
        ))}
      </div>
    </div>
  );
}

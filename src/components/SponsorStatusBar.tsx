"use client";

import { useState } from "react";
import { CheckCircle2, CircleDot, ExternalLink, Info, X } from "lucide-react";
import type { SponsorIntegrationStatus } from "@/lib/types";

interface Props {
  sponsors: SponsorIntegrationStatus[];
}

export function SponsorStatusBar({ sponsors }: Props) {
  const [selected, setSelected] = useState<SponsorIntegrationStatus | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {sponsors.map((sp) => {
          const isLive = sp.mode === "live";
          const isReady = sp.mode === "ready";
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSelected(sp)}
              title={sp.detail}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isLive
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400"
                  : isReady
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:border-sky-400"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-amber-400/50"
              }`}
            >
              {isLive ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <CircleDot
                  className={`h-3.5 w-3.5 ${isReady ? "text-sky-400" : "text-amber-400/80"}`}
                />
              )}
              <span>{sp.name}</span>
              <span
                className={`rounded px-1 py-0.2 text-[10px] uppercase tracking-wider ${
                  isLive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isReady
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-white/10 text-zinc-400"
                }`}
              >
                {isLive ? "Live" : isReady ? "Ready" : "Fallback"}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/12 bg-[#111521] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-400" />
                  <h3 className="text-base font-semibold text-white">{selected.name}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase text-amber-300">
                    {selected.mode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{selected.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm text-zinc-200">{selected.detail}</p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Environment Variables (.env.local / Vercel)
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.envVars.map((env) => (
                  <code
                    key={env}
                    className="rounded bg-white/8 px-2 py-0.5 font-mono text-xs text-amber-200"
                  >
                    {env}
                  </code>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
              >
                Open {selected.name} Console
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

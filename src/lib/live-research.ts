import type { BreakdownSlice, ResearchKPI, ResearchSignal, SignalSource } from "./types";

interface RawGatherResult {
  signals: ResearchSignal[];
  wikipediaSummary: string;
  sourceCounts: Record<SignalSource, number>;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function safeClean(text: string | null | undefined, maxLen = 220): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, maxLen);
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 7000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

async function fetchGitHubSignals(topic: string): Promise<ResearchSignal[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DiyaPulse-A2A-Hackathon/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=6`;
  const res = await fetchWithTimeout(url, { headers });
  if (!res || !res.ok) return [];

  const json = (await res.json()) as {
    items?: Array<{
      id: number;
      full_name: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      language: string | null;
      html_url: string;
      updated_at: string;
      topics?: string[];
    }>;
  };

  const items = json.items || [];
  const maxStars = Math.max(...items.map((i) => i.stargazers_count || 1), 100);

  return items.map((repo, idx) => {
    const normalized = Math.min(99, Math.max(38, Math.round((Math.log10(repo.stargazers_count + 10) / Math.log10(maxStars + 10)) * 96)));
    return {
      id: `gh-${repo.id || idx}`,
      name: repo.full_name,
      source: "GitHub",
      category: repo.language || "Open Source",
      score: normalized,
      metricLabel: "Stars",
      metricValue: repo.stargazers_count || 0,
      metricFormatted: `${formatCompact(repo.stargazers_count || 0)} ★`,
      summary: safeClean(repo.description, 200) || `Open-source repository in ${repo.language || "software"} with ${formatCompact(repo.forks_count)} forks.`,
      url: repo.html_url,
      date: (repo.updated_at || new Date().toISOString()).slice(0, 10),
      tags: (repo.topics || []).slice(0, 3).length ? (repo.topics || []).slice(0, 3) : [repo.language || "OSS", "GitHub"],
    };
  });
}

async function fetchHackerNewsSignals(topic: string): Promise<ResearchSignal[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=6`;
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return [];

  const json = (await res.json()) as {
    hits?: Array<{
      objectID: string;
      title: string;
      url?: string;
      points?: number;
      num_comments?: number;
      created_at?: string;
      author?: string;
    }>;
  };

  const hits = (json.hits || []).filter((h) => h.title);
  const maxPts = Math.max(...hits.map((h) => h.points || 1), 50);

  return hits.map((hit, idx) => {
    const pts = hit.points || 10;
    const comments = hit.num_comments || 0;
    const normalized = Math.min(96, Math.max(32, Math.round((pts / maxPts) * 75 + Math.min(20, comments / 12))));
    return {
      id: `hn-${hit.objectID || idx}`,
      name: safeClean(hit.title, 110),
      source: "Hacker News",
      category: "Community Pulse",
      score: normalized,
      metricLabel: "HN Points",
      metricValue: pts,
      metricFormatted: `${formatCompact(pts)} pts · ${comments} cmts`,
      summary: `Hacker News discussion by @${hit.author || "community"} generating ${pts} upvotes and ${comments} developer comments.`,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      date: (hit.created_at || new Date().toISOString()).slice(0, 10),
      tags: ["Discussion", "Hacker News"],
    };
  });
}

async function fetchArxivSignals(topic: string): Promise<ResearchSignal[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(topic)}&start=0&max_results=4&sortBy=relevance&sortOrder=descending`;
  const res = await fetchWithTimeout(url, undefined, 7500);
  if (!res || !res.ok) return [];

  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1);
  const signals: ResearchSignal[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const title = safeClean(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1], 120);
    const summary = safeClean(entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1], 210);
    const idUrl = safeClean(entry.match(/<id>([\s\S]*?)<\/id>/)?.[1], 180);
    const published = safeClean(entry.match(/<published>([\s\S]*?)<\/published>/)?.[1], 20);
    const category = entry.match(/<category[^>]*term="([^"]+)"/)?.[1] || "Research Paper";

    if (!title || !idUrl) continue;
    const score = Math.max(52, 86 - i * 7);
    signals.push({
      id: `arxiv-${i}`,
      name: title,
      source: "arXiv",
      category: `Paper (${category})`,
      score,
      metricLabel: "Relevance",
      metricValue: score,
      metricFormatted: `${score}/100 rel`,
      summary: summary || "Recent scientific preprint indexed on arXiv.",
      url: idUrl.replace(/^http:\/\//, "https://"),
      date: (published || new Date().toISOString()).slice(0, 10),
      tags: ["arXiv", category],
    });
  }
  return signals;
}

async function fetchWikipediaSignal(topic: string): Promise<{ summary: string; signal: ResearchSignal | null }> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(topic)}&limit=1&namespace=0&format=json`;
  const searchRes = await fetchWithTimeout(searchUrl);
  if (!searchRes || !searchRes.ok) return { summary: "", signal: null };

  const openSearch = (await searchRes.json()) as [string, string[], string[], string[]];
  const title = openSearch?.[1]?.[0];
  const pageUrl = openSearch?.[3]?.[0];
  if (!title) return { summary: "", signal: null };

  const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const sumRes = await fetchWithTimeout(sumUrl);
  if (!sumRes || !sumRes.ok) return { summary: "", signal: null };

  const sumJson = (await sumRes.json()) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
  const extract = safeClean(sumJson.extract, 320);
  const canonicalUrl = sumJson.content_urls?.desktop?.page || pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

  return {
    summary: extract,
    signal: {
      id: "wiki-0",
      name: sumJson.title || title,
      source: "Wikipedia",
      category: "Knowledge Base",
      score: 78,
      metricLabel: "Reference",
      metricValue: 1,
      metricFormatted: "Canonical Ref",
      summary: extract || `Canonical overview of ${title}.`,
      url: canonicalUrl,
      date: new Date().toISOString().slice(0, 10),
      tags: ["Reference", "Wikipedia"],
    },
  };
}

export async function gatherLiveWebSignals(topic: string): Promise<RawGatherResult> {
  const [github, hn, arxiv, wiki] = await Promise.all([
    fetchGitHubSignals(topic),
    fetchHackerNewsSignals(topic),
    fetchArxivSignals(topic),
    fetchWikipediaSignal(topic),
  ]);

  const combined: ResearchSignal[] = [...github, ...hn, ...arxiv];
  if (wiki.signal) combined.push(wiki.signal);

  combined.sort((a, b) => b.score - a.score);

  return {
    signals: combined,
    wikipediaSummary: wiki.summary,
    sourceCounts: {
      GitHub: github.length,
      "Hacker News": hn.length,
      arXiv: arxiv.length,
      Wikipedia: wiki.signal ? 1 : 0,
    },
  };
}

export function buildBreakdowns(signals: ResearchSignal[]): {
  sourceBreakdown: BreakdownSlice[];
  categoryBreakdown: BreakdownSlice[];
  kpis: ResearchKPI[];
} {
  const bySource = new Map<string, { count: number; totalScore: number }>();
  const byCategory = new Map<string, { count: number; totalScore: number }>();

  for (const s of signals) {
    const src = bySource.get(s.source) || { count: 0, totalScore: 0 };
    src.count += 1;
    src.totalScore += s.score;
    bySource.set(s.source, src);

    const cat = byCategory.get(s.category) || { count: 0, totalScore: 0 };
    cat.count += 1;
    cat.totalScore += s.score;
    byCategory.set(s.category, cat);
  }

  const sourceBreakdown: BreakdownSlice[] = Array.from(bySource.entries()).map(([label, v]) => ({
    label,
    count: v.count,
    avgScore: Math.round(v.totalScore / Math.max(1, v.count)),
  }));

  const categoryBreakdown: BreakdownSlice[] = Array.from(byCategory.entries())
    .map(([label, v]) => ({
      label,
      count: v.count,
      avgScore: Math.round(v.totalScore / Math.max(1, v.count)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const ghSignals = signals.filter((s) => s.source === "GitHub");
  const totalStars = ghSignals.reduce((acc, s) => acc + s.metricValue, 0);
  const hnSignals = signals.filter((s) => s.source === "Hacker News");
  const totalHnPts = hnSignals.reduce((acc, s) => acc + s.metricValue, 0);
  const avgMomentum = signals.length
    ? Math.round(signals.reduce((acc, s) => acc + s.score, 0) / signals.length)
    : 0;
  const topSignal = signals[0];

  const kpis: ResearchKPI[] = [
    {
      label: "Live Signals Verified",
      value: String(signals.length),
      detail: `${sourceBreakdown.length} live sources (GitHub, HN, arXiv, Wiki)`,
      accent: "amber",
    },
    {
      label: "Open-Source Traction",
      value: totalStars > 0 ? `${formatCompact(totalStars)} ★` : `${ghSignals.length} repos`,
      detail: `Across top ${ghSignals.length} GitHub repositories`,
      accent: "emerald",
    },
    {
      label: "Community Heat",
      value: totalHnPts > 0 ? `${formatCompact(totalHnPts)} pts` : `${hnSignals.length} threads`,
      detail: `${hnSignals.length} active Hacker News discussions`,
      accent: "sky",
    },
    {
      label: "Avg Momentum Score",
      value: `${avgMomentum}/100`,
      detail: topSignal ? `Leader: ${topSignal.name.slice(0, 28)}` : "Normalized cross-source index",
      accent: "violet",
    },
  ];

  return { sourceBreakdown, categoryBreakdown, kpis };
}

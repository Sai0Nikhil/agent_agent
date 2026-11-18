export interface Agent37DeployResult {
  mode: "live" | "fallback";
  instanceId?: string;
  publicUrl?: string;
  note: string;
}

export function isAgent37Configured(): boolean {
  return Boolean(process.env.AGENT37_API_KEY);
}

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
  method: "GET" | "POST" = "GET",
  body?: unknown,
  timeoutMs = 15000
): Promise<{ ok: boolean; status: number; data?: T; text?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let data: T | undefined;
    try {
      data = JSON.parse(text) as T;
    } catch {
      // non-json response
    }
    return { ok: res.ok, status: res.status, data, text };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function deployDashboardToAgent37(params: {
  dashboardId: string;
  topic: string;
  html: string;
}): Promise<Agent37DeployResult> {
  const apiKey = process.env.AGENT37_API_KEY;
  if (!apiKey) {
    return {
      mode: "fallback",
      note: "Add AGENT37_API_KEY in .env.local to deploy generated apps to an isolated Agent37 Linux sandbox with a live public https://*.agent37.app URL.",
    };
  }

  const authHeader = { Authorization: `Bearer ${apiKey}` };
  let instanceId = process.env.AGENT37_INSTANCE_ID?.trim() || "";

  // 1. Reuse configured instance or find an existing running diyapulse instance, otherwise create one
  if (!instanceId) {
    const listRes = await fetchJson<{
      data?: Array<{ id: string; name?: string; status?: string }>;
    }>("https://api.agent37.com/v1/instances", authHeader, "GET");

    const existing = listRes.data?.data?.find(
      (inst) => inst.name?.startsWith("diyapulse-") && (inst.status === "running" || inst.status === "sleeping")
    );
    if (existing) {
      instanceId = existing.id;
    } else {
      const created = await fetchJson<{ id?: string }>(
        "https://api.agent37.com/v1/instances",
        authHeader,
        "POST",
        {
          template: "agent37-hermes",
          name: `diyapulse-${params.dashboardId.slice(0, 8)}`,
        },
        20000
      );
      if (!created.ok || !created.data?.id) {
        return {
          mode: "fallback",
          note: `Agent37 instance creation returned HTTP ${created.status}. Serving via built-in preview.`,
        };
      }
      instanceId = created.data.id;
    }
  }

  // 2. Write the generated interactive dashboard to ~/site/index.html & start HTTP server on port 8788
  const b64 = Buffer.from(params.html, "utf8").toString("base64");
  const slugDir = params.dashboardId.replace(/[^a-zA-Z0-9_-]/g, "");
  const cmd = [
    `mkdir -p ~/site ~/site/${slugDir} ~/.agent37/hooks`,
    `printf '%s' '${b64}' | base64 -d > ~/site/index.html`,
    `cp ~/site/index.html ~/site/${slugDir}/index.html`,
    `pgrep -f 'http.server 8788' >/dev/null || nohup python3 -m http.server 8788 --directory ~/site >/tmp/site.log 2>&1 &`,
    `grep -q 'http.server 8788' ~/.agent37/hooks/post-restart.sh 2>/dev/null || echo 'nohup python3 -m http.server 8788 --directory ~/site >/tmp/site.log 2>&1 &' >> ~/.agent37/hooks/post-restart.sh`,
    `chmod +x ~/.agent37/hooks/post-restart.sh`,
  ].join(" && ");

  const execRes = await fetchJson<{ exit_code?: number }>(
    `https://sandbox.agent37.app/v1/instances/${instanceId}/exec`,
    { "X-Agent37-Key": apiKey },
    "POST",
    { command: cmd },
    20000
  );

  if (!execRes.ok) {
    return {
      mode: "fallback",
      instanceId,
      note: `Agent37 sandbox exec returned HTTP ${execRes.status}. Serving via built-in preview.`,
    };
  }

  // 3. Open (or retrieve existing 409) permanent public HTTPS port on 8788
  const portRes = await fetchJson<{ url?: string }>(
    `https://api.agent37.com/v1/instances/${instanceId}/public-ports`,
    authHeader,
    "POST",
    { port: 8788, label: `DiyaPulse: ${params.topic.slice(0, 42)}` }
  );

  let publicUrl = portRes.data?.url;

  if (!publicUrl && portRes.status === 409) {
    const portsList = await fetchJson<{ data?: Array<{ port: number; url: string }> }>(
      `https://api.agent37.com/v1/instances/${instanceId}/public-ports`,
      authHeader,
      "GET"
    );
    publicUrl = portsList.data?.data?.find((p) => p.port === 8788)?.url;
  }

  if (!publicUrl) {
    return {
      mode: "fallback",
      instanceId,
      note: `Agent37 sandbox updated (instance ${instanceId}), but public port returned HTTP ${portRes.status}.`,
    };
  }

  return {
    mode: "live",
    instanceId,
    publicUrl,
    note: `Deployed live to isolated Agent37 Linux sandbox (${instanceId}) on port 8788.`,
  };
}

import crypto from "node:crypto";
import type { BandHandoffMessage } from "../types";

export interface BandAgentIdentity {
  id: string;
  handle: string;
  name: string;
  apiKey: string;
}

export interface BandRoomSession {
  mode: "live" | "simulated";
  roomId: string;
  roomUrl?: string;
  note: string;
  dataAgent: BandAgentIdentity;
  builderAgent: BandAgentIdentity;
  userHandle?: string;
}

const BAND_BASE = (process.env.BAND_API_BASE || "https://api.band.ai").replace(/\/$/, "");

async function bandFetch<T>(
  path: string,
  apiKey: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`${BAND_BASE}${path}`, {
      method: options.method || "GET",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, status: res.status, errorText: await res.text() };
    }
    const json = (await res.json()) as { data?: T } & T;
    return { ok: true, status: res.status, data: (json.data ?? json) as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorText: err instanceof Error ? err.message : "Network error",
    };
  }
}

export function isBandConfigured(): boolean {
  return Boolean(
    process.env.BAND_USER_API_KEY &&
      process.env.BAND_DATA_AGENT_API_KEY &&
      process.env.BAND_BUILDER_AGENT_API_KEY
  );
}

export async function createBandA2ARoom(topic: string): Promise<BandRoomSession> {
  const userKey = process.env.BAND_USER_API_KEY;
  const dataKey = process.env.BAND_DATA_AGENT_API_KEY;
  const builderKey = process.env.BAND_BUILDER_AGENT_API_KEY;

  const fallbackSession: BandRoomSession = {
    mode: "simulated",
    roomId: `band-room-${crypto.randomBytes(4).toString("hex")}`,
    note: "Running local A2A room bus. Add BAND_USER_API_KEY, BAND_DATA_AGENT_API_KEY, and BAND_BUILDER_AGENT_API_KEY in .env.local to sync live with app.band.ai.",
    dataAgent: {
      id: "agent-data-lyzr",
      handle: "data.agent",
      name: "Data Agent (Lyzr)",
      apiKey: "",
    },
    builderAgent: {
      id: "agent-builder-adal",
      handle: "builder.agent",
      name: "Builder Agent (AdaL)",
      apiKey: "",
    },
  };

  if (!userKey || !dataKey || !builderKey) {
    return fallbackSession;
  }

  // 1. Resolve both agent identities + user profile from live BAND API
  const [dataMe, builderMe, userMe] = await Promise.all([
    bandFetch<{ id: string; handle: string; name: string }>("/api/v1/agent/me", dataKey),
    bandFetch<{ id: string; handle: string; name: string }>("/api/v1/agent/me", builderKey),
    bandFetch<{ id: string; handle?: string; name?: string }>("/api/v1/me/profile", userKey),
  ]);

  if (!dataMe.ok || !dataMe.data || !builderMe.ok || !builderMe.data) {
    return {
      ...fallbackSession,
      note: `BAND credential check failed (${dataMe.status || builderMe.status}). Falling back to local A2A room.`,
    };
  }

  const dataAgent: BandAgentIdentity = {
    id: dataMe.data.id,
    handle: dataMe.data.handle || "data.agent",
    name: dataMe.data.name || "Data Agent",
    apiKey: dataKey,
  };
  const builderAgent: BandAgentIdentity = {
    id: builderMe.data.id,
    handle: builderMe.data.handle || "builder.agent",
    name: builderMe.data.name || "Builder Agent",
    apiKey: builderKey,
  };

  // 2. Atomically create shared BAND room with both agents + opener @mention
  const roomRes = await bandFetch<{ id: string; title?: string }>("/api/v1/me/chats", userKey, {
    method: "POST",
    body: {
      chat: {
        title: `DiyaPulse A2A: ${topic.slice(0, 80)}`,
        participants: [
          { type: "agent", id: dataAgent.id },
          { type: "agent", id: builderAgent.id },
        ],
        message: {
          content: `@${dataAgent.handle} Research "${topic}" using Finch live-web-research and dataset-normalizer skills, then hand off structured JSON to @${builderAgent.handle}.`,
          mentions: [
            { id: dataAgent.id, handle: dataAgent.handle, name: dataAgent.name },
            { id: builderAgent.id, handle: builderAgent.handle, name: builderAgent.name },
          ],
        },
      },
    },
  });

  if (!roomRes.ok || !roomRes.data?.id) {
    return {
      ...fallbackSession,
      dataAgent,
      builderAgent,
      note: `BAND room creation returned HTTP ${roomRes.status}. Falling back to local A2A room.`,
    };
  }

  return {
    mode: "live",
    roomId: roomRes.data.id,
    roomUrl: `https://app.band.ai/chats/${roomRes.data.id}`,
    note: `Connected live to BAND room ${roomRes.data.id} with @${dataAgent.handle} and @${builderAgent.handle}.`,
    dataAgent,
    builderAgent,
    userHandle: userMe.data?.handle,
  };
}

export async function postBandAgentMessage(params: {
  session: BandRoomSession;
  from: "data-agent" | "builder-agent";
  to: "data-agent" | "builder-agent" | "human";
  content: string;
  sponsorBadge: BandHandoffMessage["sponsorBadge"];
  payloadPreview?: Record<string, unknown>;
}): Promise<BandHandoffMessage> {
  const { session, from, to, content, sponsorBadge, payloadPreview } = params;
  const sender = from === "data-agent" ? session.dataAgent : session.builderAgent;
  const target =
    to === "data-agent"
      ? session.dataAgent
      : to === "builder-agent"
      ? session.builderAgent
      : {
          id: "",
          handle: session.userHandle || "owner",
          name: "Room Owner",
        };

  let bandMessageId: string | undefined;
  let actualMode: "live" | "simulated" = session.mode;

  if (session.mode === "live" && sender.apiKey) {
    const mentionObj = target.id
      ? { id: target.id, handle: target.handle, name: target.name }
      : { handle: target.handle };

    const fullContent = content.includes(`@${target.handle}`)
      ? content
      : `@${target.handle} ${content}`;

    const res = await bandFetch<{ id?: string }>(
      `/api/v1/agent/chats/${session.roomId}/messages`,
      sender.apiKey,
      {
        method: "POST",
        body: {
          message: {
            content: fullContent,
            mentions: [mentionObj],
          },
        },
      }
    );

    if (res.ok && res.data?.id) {
      bandMessageId = res.data.id;
    } else {
      actualMode = "simulated";
    }
  }

  return {
    id: bandMessageId || `msg-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    senderRole: from,
    senderName: sender.name,
    senderHandle: sender.handle,
    mentions: [target.handle],
    content,
    sponsorBadge,
    bandMode: actualMode,
    bandMessageId,
    payloadPreview,
  };
}

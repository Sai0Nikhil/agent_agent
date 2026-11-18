export type SignalSource = "GitHub" | "Hacker News" | "arXiv" | "Wikipedia";

export interface ResearchSignal {
  id: string;
  name: string;
  source: SignalSource;
  category: string;
  score: number; // 0-100 normalized momentum score
  metricLabel: string;
  metricValue: number;
  metricFormatted: string;
  summary: string;
  url: string;
  date: string;
  tags: string[];
}

export interface ResearchKPI {
  label: string;
  value: string;
  detail: string;
  accent: "amber" | "emerald" | "sky" | "violet";
}

export interface BreakdownSlice {
  label: string;
  count: number;
  avgScore: number;
}

export interface ResearchDataset {
  id: string;
  topic: string;
  generatedAt: string;
  executiveSummary: string;
  kpis: ResearchKPI[];
  signals: ResearchSignal[];
  sourceBreakdown: BreakdownSlice[];
  categoryBreakdown: BreakdownSlice[];
  insights: string[];
  recommendations: string[];
  provenance: {
    dataEngine: "lyzr" | "gemini" | "openai" | "deterministic";
    skillsLoaded: string[];
    totalRawSignals: number;
  };
}

export interface LoadedSkill {
  name: string;
  provider: "finch" | "adal";
  version: string;
  description: string;
  path: string;
  excerpt: string;
}

export interface BandHandoffMessage {
  id: string;
  timestamp: string;
  senderRole: "human" | "data-agent" | "builder-agent" | "system";
  senderName: string;
  senderHandle: string;
  mentions: string[];
  content: string;
  sponsorBadge: "BAND" | "Finch" | "Lyzr" | "AdaL" | "Agent37";
  bandMode: "live" | "simulated";
  bandMessageId?: string;
  payloadPreview?: Record<string, unknown>;
}

export interface SponsorIntegrationStatus {
  id: "band" | "lyzr" | "finch" | "adal" | "agent37" | "llm";
  name: string;
  role: string;
  mode: "live" | "ready" | "fallback";
  detail: string;
  url: string;
  envVars: string[];
}

export interface BuilderResult {
  dashboardId: string;
  title: string;
  html: string;
  builderEngine: "adal-gemini" | "adal-openai" | "adal-template";
  adalSkillUsed: string;
  agent37Mode: "live" | "fallback";
  agent37InstanceId?: string;
  agent37PublicUrl?: string;
  localPreviewUrl: string;
  buildNotes: string[];
}

export type PipelineStreamEvent =
  | {
      type: "stage";
      stage: "init" | "finch" | "data_gather" | "lyzr_synthesize" | "band_handoff" | "adal_build" | "agent37_deploy" | "complete" | "error";
      message: string;
      progress: number;
    }
  | {
      type: "band_room";
      roomId: string;
      roomUrl?: string;
      mode: "live" | "simulated";
      note: string;
    }
  | {
      type: "skills";
      skills: LoadedSkill[];
      finchMcpReachable: boolean;
    }
  | {
      type: "message";
      message: BandHandoffMessage;
    }
  | {
      type: "dataset";
      dataset: ResearchDataset;
    }
  | {
      type: "build";
      result: BuilderResult;
    }
  | {
      type: "error";
      error: string;
    };

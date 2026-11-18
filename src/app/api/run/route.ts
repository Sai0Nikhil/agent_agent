import crypto from "node:crypto";
import { gatherLiveWebSignals } from "@/lib/live-research";
import { loadWorkspaceSkills, probeFinchMcp } from "@/lib/skills-loader";
import { runAdaLBuilderAgent } from "@/lib/sponsors/adal-builder";
import { createBandA2ARoom, postBandAgentMessage } from "@/lib/sponsors/band";
import { synthesizeWithLyzrDataAgent } from "@/lib/sponsors/lyzr";
import type { PipelineStreamEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let topic = "";
  let customDirective = "";

  try {
    const body = (await req.json()) as { topic?: string; customDirective?: string };
    topic = (body.topic || "").trim();
    customDirective = (body.customDirective || "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!topic || topic.length < 2) {
    return new Response(JSON.stringify({ error: "Please provide a research topic." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PipelineStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // 1. Load Finch & AdaL skills
        send({
          type: "stage",
          stage: "finch",
          message: "Loading Finch SKILL.md modules & AdaL Builder harness...",
          progress: 12,
        });
        const skills = loadWorkspaceSkills();
        const finchProbe = await probeFinchMcp();
        send({ type: "skills", skills, finchMcpReachable: finchProbe.reachable });

        // 2. Open BAND shared A2A room
        send({
          type: "stage",
          stage: "init",
          message: "Initializing BAND shared A2A room with @data.agent and @builder.agent...",
          progress: 24,
        });
        const bandSession = await createBandA2ARoom(topic);
        send({
          type: "band_room",
          roomId: bandSession.roomId,
          roomUrl: bandSession.roomUrl,
          mode: bandSession.mode,
          note: bandSession.note,
        });

        send({
          type: "message",
          message: {
            id: `human-${crypto.randomBytes(4).toString("hex")}`,
            timestamp: new Date().toISOString(),
            senderRole: "human",
            senderName: "You (Room Owner)",
            senderHandle: bandSession.userHandle || "owner",
            mentions: [bandSession.dataAgent.handle, bandSession.builderAgent.handle],
            content: `@${bandSession.dataAgent.handle} Gather live web intelligence on "${topic}" and structure it into a validated ResearchDataset JSON for @${bandSession.builderAgent.handle}.${
              customDirective ? ` Builder focus: ${customDirective}` : ""
            }`,
            sponsorBadge: "BAND",
            bandMode: bandSession.mode,
          },
        });

        // 3. Data Agent executes Finch live-web-research
        send({
          type: "stage",
          stage: "data_gather",
          message: "Data Agent executing Finch `live-web-research` across GitHub, Hacker News, arXiv & Wikipedia...",
          progress: 42,
        });
        const gathered = await gatherLiveWebSignals(topic);

        const gatherMsg = await postBandAgentMessage({
          session: bandSession,
          from: "data-agent",
          to: "builder-agent",
          sponsorBadge: "Finch",
          content: `Executed Finch \`live-web-research\` skill: collected ${gathered.signals.length} live signals (GitHub: ${gathered.sourceCounts.GitHub}, HN: ${gathered.sourceCounts["Hacker News"]}, arXiv: ${gathered.sourceCounts.arXiv}, Wikipedia: ${gathered.sourceCounts.Wikipedia}). Running Lyzr synthesis & Finch \`dataset-normalizer\`...`,
          payloadPreview: {
            skill: "finch/live-web-research",
            sourceCounts: gathered.sourceCounts,
          },
        });
        send({ type: "message", message: gatherMsg });

        // 4. Data Agent synthesizes via Lyzr Agent Studio
        send({
          type: "stage",
          stage: "lyzr_synthesize",
          message: "Data Agent running Lyzr synthesis & Finch `dataset-normalizer`...",
          progress: 60,
        });
        const dataset = await synthesizeWithLyzrDataAgent({
          topic,
          signals: gathered.signals,
          wikipediaSummary: gathered.wikipediaSummary,
          skills,
        });
        send({ type: "dataset", dataset });

        // 5. BAND A2A structured handoff from Data Agent -> Builder Agent
        send({
          type: "stage",
          stage: "band_handoff",
          message: `Data Agent handing off validated ResearchDataset (${dataset.signals.length} signals) to @${bandSession.builderAgent.handle} via BAND...`,
          progress: 72,
        });
        const handoffMsg = await postBandAgentMessage({
          session: bandSession,
          from: "data-agent",
          to: "builder-agent",
          sponsorBadge: "Lyzr",
          content: `@${bandSession.builderAgent.handle} Research complete via ${dataset.provenance.dataEngine.toUpperCase()} engine! Passing validated ResearchDataset JSON (${dataset.signals.length} live signals, ${dataset.kpis.length} KPIs, ${dataset.insights.length} insights). Please compile the interactive dashboard using AdaL harness + Finch \`dashboard-blueprint\` and publish via Agent37.`,
          payloadPreview: {
            datasetId: dataset.id,
            engine: dataset.provenance.dataEngine,
            kpis: dataset.kpis.map((k) => `${k.label}: ${k.value}`),
            topSignal: dataset.signals[0]?.name || "N/A",
          },
        });
        send({ type: "message", message: handoffMsg });

        // 6. Builder Agent (AdaL harness) generates interactive dashboard + deploys to Agent37
        send({
          type: "stage",
          stage: "adal_build",
          message: "Builder Agent executing AdaL `.adal/skills/research-dashboard-builder` & deploying to Agent37 sandbox...",
          progress: 88,
        });
        const buildResult = await runAdaLBuilderAgent({
          dataset,
          skills,
          customDirective,
        });
        send({ type: "build", result: buildResult });

        // 7. Builder Agent reports completion back into BAND room
        const completionMsg = await postBandAgentMessage({
          session: bandSession,
          from: "builder-agent",
          to: "human",
          sponsorBadge: buildResult.agent37Mode === "live" ? "Agent37" : "AdaL",
          content:
            buildResult.agent37Mode === "live" && buildResult.agent37PublicUrl
              ? `Dashboard "${buildResult.title}" built with AdaL harness and deployed live on Agent37 sandbox (${buildResult.agent37InstanceId})! Public URL: ${buildResult.agent37PublicUrl}`
              : `Dashboard "${buildResult.title}" built with AdaL harness (${buildResult.builderEngine}) and ready in the Live App Preview tab (standalone preview: ${buildResult.localPreviewUrl}).`,
          payloadPreview: {
            dashboardId: buildResult.dashboardId,
            adalSkill: buildResult.adalSkillUsed,
            agent37Mode: buildResult.agent37Mode,
            agent37PublicUrl: buildResult.agent37PublicUrl || "local-preview",
          },
        });
        send({ type: "message", message: completionMsg });

        send({
          type: "stage",
          stage: "complete",
          message: "A2A Research-to-Build mission complete!",
          progress: 100,
        });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Pipeline execution failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

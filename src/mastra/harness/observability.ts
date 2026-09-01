import {
  MastraStorageExporter,
  Observability,
  SamplingStrategyType,
  SensitiveDataFilter,
} from "@mastra/observability";

export const observabilityHarness = new Observability({
  configs: {
    default: {
      serviceName: "mastra",
      exporters: [new MastraStorageExporter()],
      spanOutputProcessors: [new SensitiveDataFilter()],
      logging: {
        enabled: true,
        level: "info",
      },
      sampling: {
        type: SamplingStrategyType.ALWAYS,
      },
      requestContextKeys: [
        // ── user/identity identifiers ──
        "userId",
        // ── Session identifiers ──
        "harness.threadId",
        "harness.resourceId",
        "harness.harnessId",
        "harness.session.modeId",
        "harness.session.modelId",
        // ── Typed state fields (your CampaignState) ──
        "harness.state.campaignId",
        "harness.state.brandVoice",
        "harness.state.publishTarget",
        // ── Agent settings ──
        "harness.state.yolo",
        "harness.state.thinkingLevel",
        // ── OM settings ──
        "harness.state.omScope",
      ],
    },
  },
});

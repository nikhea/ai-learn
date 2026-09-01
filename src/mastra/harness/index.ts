import { Harness } from "@mastra/core/harness";
import { redisPubSub } from "../connections";
import { Memory } from "@mastra/memory";
import { ollama } from "ollama-ai-provider-v2";
import { workspaceHarness } from "./workspace";
import { memoryOptionsHarness, storageHarness } from "./storage";
import { observabilityHarness } from "./observability";
import { contentDirectorAgentHarness } from "./agent";
import { modesHarness } from "./modes";
import { subagentsHarness } from "./subagents";
import type { MemoryConfigInternal } from "@mastra/core/memory";
import { IMastraLogger } from "@mastra/core/logger";
import { campaignStateSchema } from "./state";
import { weatherTool } from "../tools/weather-tool";
import { weatherWorkflow } from "../workflows/weather-workflow";

let logger: IMastraLogger | undefined;

export function setHarnessLogger(log: IMastraLogger) {
  logger = log;
}

// const instruction = workspaceHarness.getInstructions();

// console.log({ instruction });

export const harness = new Harness({
  id: "campaign-harness",
  instructions: `hello you are a harness`,
  agent: contentDirectorAgentHarness,
  pubsub: redisPubSub,
  stateSchema: campaignStateSchema,
  storage: storageHarness,
  workspace: workspaceHarness,
  observability: observabilityHarness,
  modes: modesHarness,
  subagents: subagentsHarness,
  initialState: {
    brandVoice: "formal",
    yolo: false,
  },
  tools({ requestContext, mastra }) {
    return {
      weatherTool,
      // weatherWorkflo
    };
  },
  memory({ requestContext, mastra }) {
    const vectorStore = mastra?.getVector("libsql");
    return new Memory({
      vector: vectorStore,
      embedder: ollama.embeddingModel("nomic-embed-text:latest"),
      options: memoryOptionsHarness as MemoryConfigInternal,
    });
  },
  omConfig: {},
});

harness.subscribe(async (event) => {
  switch (event.type) {
    case "message_update":
      const text = event.message.content
        .filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; text: string }).text)
        .join("");
      logger?.info("message_update", { content: text });
      break;
    case "tool_approval_required":
      harness.session.respondToToolApproval({ decision: "approve" });
      break;
    case "state_changed":
      logger?.info("state_changed", { keys: event.changedKeys });
      break;
    case "goal_evaluation":
      logger?.info("goal_evaluation", { result: event });
      break;
    case "error":
      logger?.error("harness_error", { error: event.error });
      break;
  }
});

// harness.subscribe((event) => {
//   if (event.type === "message_update") {
//     logger.info("harness", event);
//   }
// });

export const marketingHarness = harness;

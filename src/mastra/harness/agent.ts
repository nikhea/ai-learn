import { Agent, ModelWithRetries } from "@mastra/core/agent";
import { MemoryConfigInternal } from "@mastra/core/memory";
import { Memory } from "@mastra/memory";
import { ollama } from "ollama-ai-provider-v2";
import { memoryOptionsHarness } from "./storage";

const model: ModelWithRetries[] = [
  {
    model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    maxRetries: 2,
  },
  { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 3 },
  { model: "openrouter/deepseek/deepseek-v4-flash:free", maxRetries: 3 },

  { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 2 },
  { model: "google/gemini-2.5-pro", maxRetries: 2 },
];

export const contentDirectorAgentHarness = new Agent({
  id: "Content Director Agent",
  name: "ContentDirector",
  instructions:
    "You are an expert Content Marketing Director. You oversee campaigns, ensure brand consistency, and manage your team of subagents to distribute content across all channels.",
  model,
  memory({ requestContext, mastra }) {
    const vectorStore = mastra?.getVector("libsql");
    return new Memory({
      vector: vectorStore,
      embedder: ollama.embeddingModel("nomic-embed-text:latest"),
      options: memoryOptionsHarness as MemoryConfigInternal,
    });
  },
  signals: [],
  inputProcessors({ requestContext, mastra }) {
    return [];
  },
  outputProcessors({ requestContext, mastra }) {
    return [];
  },
  errorProcessors({ requestContext, mastra }) {
    return [];
  },

  defaultOptions({ requestContext, mastra }) {
    return {};
  },
  metadata: {},
});

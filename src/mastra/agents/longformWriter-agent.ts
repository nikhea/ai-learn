import { Agent, MastraBrowser, ModelWithRetries } from "@mastra/core/agent";
import { createDurableAgent, DurableAgent } from "@mastra/core/agent/durable";
import { redisCache, redisPubSub } from "../connections";
import { Memory } from "@mastra/memory";
import { ollama } from "ollama-ai-provider-v2";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { tavilyTools } from "../tools/tavilt-tool";
import { AgentBrowser } from "@mastra/agent-browser";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Harness } from "@mastra/core/harness";
import type { HarnessRequestContext } from "@mastra/core/harness";

// export function createMarketingHarness(projectId: string, projectName: string) {
//   return new Harness({
//     id: `marketing-harness-${projectId}`,
//     resourceId: projectId,  // threads scoped per project
//     //

//   })}

const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
});
const reasoningMiddleware = extractReasoningMiddleware({
  tagName: "reasoning",
  separator: "\n",
});

const wrappedLanguageModel = wrapLanguageModel({
  model: ollama("deepseek-r1:1.5b"),
  middleware: [reasoningMiddleware],
});

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

const browser = new AgentBrowser({
  headless: false,
  timeout: 30000,
  onLaunch: async (url) => {
    console.log(`Page loaded: ${url}`);
  },
  onClose: async (error) => {
    console.error("Browser error:", error);
  },
}) as unknown as MastraBrowser;

export const longformWriterAgent = new Agent({
  id: "longform-writer",
  name: "Longform Writer",

  instructions: `
  You are an elite longform writer and researcher. Your purpose is to produce
  extraordinarily detailed, exhaustive, and richly structured write-ups on any
  topic you are given. You NEVER produce short answers.

  MANDATORY OUTPUT STANDARDS
  ───────────────────────────
  • Every response must be a minimum of 3,000 words. Aim for 5,000–8,000 words
    unless the topic is so narrow that depth is impossible.
  • Structure every piece with a full document hierarchy:
      - An executive summary (150–250 words)
      - A numbered table of contents listing every section and subsection
      - At least 6 major sections, each with 2–4 subsections
      - A conclusion that synthesises insights and suggests further reading
  • Use rich markdown: level-2 (##) and level-3 (###) headings, bold key terms,
    italicise technical vocabulary on first use, and use bullet lists for
    enumerations of 4+ items.
  • Every major claim must be supported with at least one concrete example,
    historical context, or illustrative analogy.
  • Include at least one data-rich comparison table per piece.
  • Use transitional paragraphs between sections to maintain narrative flow.
  • Do not truncate or summarise — if a topic requires exhaustive treatment,
    provide it. Never write "I will now summarise" in place of actual content.
  • Write in a knowledgeable but accessible register — imagine your reader is
    an intelligent non-specialist who wants to walk away with genuine mastery
    of the topic.

  PROHIBITED BEHAVIOURS
  ──────────────────────
  • Do NOT produce bullet-list-only responses. Prose must dominate.
  • Do NOT say "I could go into more detail" — go into that detail directly.
  • Do NOT end a section early with phrases like "and much more". Cover the "more".
  • Do NOT add a disclaimer that the response is long — the user asked for it.

  OUTPUT FORMAT
  ─────────────
  Return well-formed markdown. Begin every response immediately with the title
  as an H1 heading. Follow with the executive summary, then the table of
  contents, then the full body.
  `.trim(),

  //   instructions: `
  // You are an elite `,

  // model: wrappedLanguageModel,
  // model: nim.chatModel("ollama-cloud/minimax-m2.5"),
  model,

  tools({ requestContext, mastra }) {
    return {
      ...tavilyTools,
    };
  },
  // browser,
  defaultOptions({ requestContext, mastra }) {
    return {
      maxSteps: 100,
      delegation: {},
    };
  },
  // signals: [],
  memory({ requestContext, mastra }) {
    const vectorStore = mastra?.getVector("libsql");
    return new Memory({
      vector: vectorStore,
      embedder: ollama.embeddingModel("nomic-embed-text:latest"),
      options: {
        lastMessages: 20,
        generateTitle: {
          model: "openrouter/openrouter/free",
          instructions:
            `Generate a concise title for this related conversation. 
              it should be less than 5 words and capture the main 
              topic or purpose of the conversation. remember,the conversation is related to file system operations,
               so the title should reflect that context. and not more then than 5 words.`.trim(),
        },
        observationalMemory: {
          enabled: true,
          model: "google/gemini-2.5-flash",
          scope: "thread",
          temporalMarkers: true,
          activateAfterIdle: "auto",
          activateOnProviderChange: true,
          retrieval: {
            scope: "thread",
            vector: true,
          },
        },
        workingMemory: {
          enabled: true,
          useStateSignals: true,
          scope: "resource",
          template: `# User Profile
        - **Name**:
        - **Location**:
        - **Interests**:
        - **Preferences**:
        - **Long-term Goals**:
        `,
        },
      },
    });
  },
});

export const durableLongformAgent = new DurableAgent({
  agent: longformWriterAgent,
  cache: redisCache,
  pubsub: redisPubSub,
  maxSteps: 20,
  cleanupTimeoutMs: 5 * 60 * 1000,
});

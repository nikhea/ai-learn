import { Agent, ModelWithRetries } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { weatherTool } from "../tools/weather-tool";
import { scorers } from "../scorers/weather-scorer";
import {
  BatchPartsProcessor,
  CostGuardProcessor,
  RegexFilterProcessor,
  RegexRule,
  UnicodeNormalizer,
  AgentsMDInjector,
  PrefillErrorHandler,
  ProviderHistoryCompat,
  StreamErrorRetryProcessor,
} from "@mastra/core/processors";
import { fastembed } from "@mastra/fastembed";
import { ollama } from "ollama-ai-provider-v2";
import { Mastra } from "@mastra/core";
import { RequestContext } from "@mastra/core/request-context";
import { Workspace } from "@mastra/core/workspace";
import { DockerSandbox } from "@mastra/docker";
import { BrowserViewer } from "@mastra/browser-viewer";
import type { MastraBrowser } from "@mastra/core/browser";
import { S3Filesystem } from "@mastra/s3";
import { UserSystemPromptProcessor } from "../processors/user.processors";
import { userRequestContext } from "../context/user.context";
import { createVectorQueryTool } from "@mastra/rag";
import { libsqlVector } from "../connections";
import { LIBSQL_PROMPT } from "@mastra/libsql";
import { bodyLimit } from "hono/body-limit";
import { Hono } from "hono";

const workspace = new Workspace({
  filesystem: new S3Filesystem({
    bucket: "mastra-bucket-test",
    region: "us-east-1",
    endpoint: "http://localhost:9101",
    accessKeyId: "admin",
    secretAccessKey: "adminpassword",
  }),
  sandbox: new DockerSandbox({
    id: "node-sandbox",
    image: "node:22-slim",
    command: ["sleep", "infinity"],
    workingDir: "/workspace",
    env: { NODE_ENV: "production" },
    timeout: 300000,
  }),
  skills: ["/skills", ".agents/skills"],
  bm25: true,
  lsp: true,
  autoIndexPaths: ["/workspace"],
  browser: new BrowserViewer({
    cli: "agent-browser",
    headless: false,
    onLaunch: async (browserInstance) => {
      console.log("Browser launched:", browserInstance);
    },
    onClose: async (browserInstance) => {
      console.log("Browser closed", browserInstance);
    },
  }) as unknown as MastraBrowser,
});

const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "libsql",
  indexName: "embeddings_test",
  model: ollama.embeddingModel("nomic-embed-text:latest"),
  includeSources: true,
});

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  description: `This agent provides weather information and activity suggestions based on the weather. It uses a tool to fetch current weather data for specified locations, translating non-English location names as needed. The agent is designed to give concise yet informative responses, including details like humidity and wind conditions, and can suggest activities based on the forecast.`,
  instructions: `You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

Your primary function is to help users get weather details for specific locations. When responding:
- Always ask for a location if none is provided
- If the location name isn't in English, please translate it
- If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
- Include relevant details like humidity, wind conditions, and precipitation
- Keep responses concise but informative
- If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
- If the user asks for activities, respond in the format they request.

Use the weatherTool to fetch current weather data.

    Use the vector query tool 
    to find relevant information from the knowledge base and answer 
    questions based on the retrieved content. Always retrieve 10 results
 ${LIBSQL_PROMPT}
`,
  // model: "groq/llama-3.3-70b-versatile",
  model({ requestContext, mastra }) {
    return "groq/openai/gpt-oss-120b";
    return model;
  },
  tools({ requestContext, mastra }) {
    return { weatherTool, vectorQueryTool };
  },
  memory({ requestContext, mastra }) {
    const vectorStore = mastra?.getVector("libsql");
    const storageStore = mastra?.getStorage();

    return new Memory({
      storage: storageStore,
      vector: vectorStore,
      embedder: ollama.embeddingModel("nomic-embed-text:latest"),
      options: {
        // semanticRecall: {
        //   topK: 5,
        //   messageRange: {
        //     before: 3,
        //     after: 4,
        //   },
        //   scope: "resource",
        // },
        generateTitle: {
          model: "openrouter/openrouter/free",
          instructions:
            "Generate a concise title for this weather-related conversation.",
        },
        observationalMemory: {
          enabled: true,
          model: "google/gemini-2.5-flash",
          scope: "thread",
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
  // inputProcessors({ requestContext, mastra }) {
  //   return [
  //     new UserSystemPromptProcessor(),
  //     new UnicodeNormalizer({
  //       stripControlChars: true,
  //       collapseWhitespace: true,
  //     }),
  //     new RegexFilterProcessor({
  //       presets: ["pii", "secrets", "urls"],
  //       strategy: "block",
  //       phase: "input",
  //       rules,
  //     }),
  //     new CostGuardProcessor({
  //       maxCost: 5.0,
  //       scope: "thread",
  //       window: "24h",
  //       strategy: "block",
  //     }),
  //   ];
  // },

  // outputProcessors({
  //   requestContext,
  //   mastra,
  // }: {
  //   requestContext: RequestContext;
  //   mastra?: Mastra;
  // }) {
  //   return [
  //     new BatchPartsProcessor({
  //       batchSize: 10,
  //       maxWaitTime: 100,
  //       emitOnNonText: true,
  //     }),
  //   ];
  // },
  // errorProcessors({ requestContext, mastra }) {
  //   return [
  //     new StreamErrorRetryProcessor(),
  //     new PrefillErrorHandler(),
  //     new ProviderHistoryCompat(),
  //   ];
  // },

  // scorers: {
  //   toolCallAppropriateness: {
  //     scorer: scorers.toolCallAppropriatenessScorer,
  //     sampling: {
  //       type: "ratio",
  //       rate: 1,
  //     },
  //   },
  //   completeness: {
  //     scorer: scorers.completenessScorer,
  //     sampling: {
  //       type: "ratio",
  //       rate: 1,
  //     },
  //   },
  //   translation: {
  //     scorer: scorers.translationScorer,
  //     sampling: {
  //       type: "ratio",
  //       rate: 1,
  //     },
  //   },
  // },
  defaultOptions({ requestContext, mastra }) {
    const logger = mastra?.getLogger();
    return {
      // disableBackgroundTasks: true,
      // requireToolApproval: true,
      // autoResumeSuspendedTools: true,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        logger?.info("Agent step finished", {
          agentId: "weather-agent",
          finishReason,
          toolCalls: toolCalls?.map((tc) => ({ name: tc.from, id: tc.runId })),
          toolResultCount: toolResults?.length ?? 0,
          usage,
        });
      },
      onFinish: async (result) => {
        logger?.info("Agent generation complete", {
          agentId: "weather-agent",
          finishReason: result.finishReason,
          usage: result.usage,
          steps: result.steps?.length,
        });
      },
      onError: async ({ error }) => {
        logger?.error("Agent generation error", {
          agentId: "weather-agent",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
      onAbort: async () => {
        logger?.warn("Agent generation aborted", {
          agentId: "weather-agent",
        });
      },
      onIterationComplete: async (context) => {
        logger?.info("Agent iteration complete", {
          agentId: "weather-agent",
          iteration: context.iteration,
          isFinal: context.isFinal,
          finishReason: context.finishReason,
          toolCalls: context.toolCalls?.map((tc) => tc.name),
          runId: context.runId,
          threadId: context.threadId,
        });
      },
    };
  },
  metadata({ requestContext, mastra }) {
    return {
      userTier: "free",
      requestTime: new Date().toISOString(),
    };
  },
  // workspace({ requestContext, mastra }) {
  //   return workspace;
  // },
});

const model: ModelWithRetries[] = [
  // {
  //   model: "groq/openai/gpt-oss-120b",
  // model: "groq/llama-3.3-70b-versatile",
  // model: "openrouter/deepseek/deepseek-v4-flash:free",
  //   maxRetries: 3,
  // },
  // {
  //   model: "openrouter/deepseek/deepseek-v4-flash:free",
  //   maxRetries: 3,
  // },
  {
    model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    maxRetries: 1,
  },
  {
    model: "ollama-cloud/minimax-m2.5",
    maxRetries: 2,
  },

  {
    model: "groq/openai/gpt-oss-120b",
    maxRetries: 2,
  },
  {
    model: "google/gemini-2.5-pro",
    maxRetries: 2,
  },
];

const rules: RegexRule[] | undefined = [
  {
    name: "env-style-secrets",
    pattern:
      /[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API_KEY|URL)[A-Z0-9_]*\s*=\s*\S+/gi,
  },
  {
    name: "sql-query",
    pattern:
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b[\s\S]*/gi,
    replacement: "[SQL_REDACTED]",
  },
  // 1. Classic tautology-based injection
  {
    name: "sql-tautology",
    pattern: /('|\")\s*(or|and)\s+('|\")?\s*\d+\s*=\s*\d+/gi,
  },

  // 2. Always-true conditions (admin bypass style)
  {
    name: "sql-always-true-condition",
    pattern: /(\bor\b|\band\b)\s+(\d+\s*=\s*\d+|'[^']*'\s*=\s*'[^']*')/gi,
  },

  // 3. Comment injection attempts
  {
    name: "sql-comment-bypass",
    pattern: /(--|#|\/\*)/g,
  },

  // 4. UNION-based injection (data extraction attempts)
  {
    name: "sql-union-injection",
    pattern: /\bunion\b\s+(all\s+)?\bselect\b/gi,
  },

  // 5. Stacked queries (multiple statements)
  {
    name: "sql-stacked-queries",
    pattern: /;\s*(select|insert|update|delete|drop|alter)\b/gi,
  },

  // 6. Dangerous schema operations
  {
    name: "sql-destructive-commands",
    pattern: /\b(drop|truncate|alter|create)\b\s+(table|database|schema)/gi,
  },

  // 7. Time-based blind injection hints
  {
    name: "sql-time-based-injection",
    pattern: /\b(sleep|benchmark|pg_sleep)\s*\(/gi,
  },
  {
    name: "sql-encoded-attack",
    pattern: /(%27|%22|%3D|%2D%2D)/gi,
  },
  {
    name: "sql-in-url-params",
    pattern:
      /(\?|&)(id|user|query|search)=.*(select|union|drop|insert|delete)/gi,
  },
  {
    name: "openai-api-key",
    pattern: /[A-Z_]*API_KEY\s*=\s*[a-zA-Z0-9_\-]+/g,
    replacement: "[REDACTED_API_KEY]",
  },
];

// const response = await weatherAgent.generate(
//   [{ role: "user", content: "Hello!" }],
//   {
//     memory: { resource: "weather-agent", thread: "123" },
//     requestContext: userRequestContext,
//   },
// );

// console.log({ response });

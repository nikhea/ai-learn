import {
  Agent,
  AgentNotificationConfig,
  ModelWithRetries,
} from "@mastra/core/agent";
import { Extractor, Memory } from "@mastra/memory";
import {
  LocalFilesystem,
  LocalSandbox,
  Workspace,
} from "@mastra/core/workspace";
import { DockerSandbox } from "@mastra/docker";
import { BrowserViewer } from "@mastra/browser-viewer";
import type { MastraBrowser } from "@mastra/core/browser";
import { S3Filesystem } from "@mastra/s3";
import { ollama } from "ollama-ai-provider-v2";
import {
  RegexFilterProcessor,
  ResponseCache,
  UnicodeNormalizer,
  CostGuardProcessor,
  RegexRule,
  AgentsMDInjector,
} from "@mastra/core/processors";
import { RedisServerCache } from "@mastra/redis";
import Redis from "ioredis";
import { AgentChannels, ChannelConfig } from "@mastra/core/channels";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { weatherTool } from "../tools/weather-tool";
import { createNotificationInboxTool } from "@mastra/core/notifications";

import { TaskSignalProvider } from "@mastra/core/signals";
import { askUserTool, submitPlanTool } from "@mastra/core/tools";
import { tavilyTools } from "../tools/tavilt-tool";
import { RequestContext } from "@mastra/core/request-context";
import z from "zod";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

const cache = new RedisServerCache({
  client: new Redis("redis://localhost:6379"),
});

// const cache = new InMemoryServerCache();

// ─── Workspace ────────────────────────────────────────────────────────────────
const workspace = new Workspace({
  //   mounts: {
  // S3 is mounted at /workspace — file tools AND execute_command
  // both resolve paths through here, so read/write/execute all share
  // the same storage.
  //     "/workspace": new S3Filesystem({
  //       bucket: "mastra-bucket-test",
  //       region: "us-east-1",
  //       endpoint: "http://localhost:9101",
  //       accessKeyId: "admin",
  //       secretAccessKey: "adminpassword",
  //     }),
  //   },
  filesystem: new LocalFilesystem({
    basePath: "./workspace",
  }),

  //   sandbox: new DockerSandbox({
  //     id: "node-sandbox",
  //     image: "node:22-slim",
  //     // s3fs needs SYS_ADMIN + /dev/fuse to FUSE-mount inside Docker
  //     privileged: true,
  //     command: [
  //       "sh",
  //       "-c",
  //       " && npm install -g pnpm" +
  //         " && pnpm add -g @llamaindex/liteparse@latest" +
  //         " && pnpm add -g @googleworkspace/cli@latest" +
  //         " && pnpm add -g typescript" +
  //         " && sleep infinity",
  //     ],
  //     workingDir: "/workspace",
  //     env: { NODE_ENV: "production" },
  //     timeout: 300000,
  //   }),
  sandbox: new LocalSandbox({
    workingDirectory: "./workspace",
    env: {
      NODE_ENV: "development",
    },
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

// ─── Model Fallback Chain ─────────────────────────────────────────────────────

const model: ModelWithRetries[] = [
  { model: "opencode/big-pickle", maxRetries: 2 },

  { model: "cerebras/gpt-oss-120b", maxRetries: 2 },

  {
    model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    maxRetries: 1,
  },
  { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 3 },
  { model: "openrouter/deepseek/deepseek-v4-flash:free", maxRetries: 3 },

  { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 2 },
  { model: "google/gemini-2.5-pro", maxRetries: 2 },
];

// ─── System Prompt ────────────────────────────────────────────────────────────

const INSTRUCTIONS = `
You are a precise file-system agent operating inside a Docker container. Your root is /workspace — you never access paths outside it.

## Mindset
- Be concise and action-oriented. Skip unnecessary preamble.
- Always confirm the outcome of every operation (success, error, or partial result).
- When a path is ambiguous, ask for clarification before acting.
- Prefer non-destructive operations. Warn before overwriting or deleting.

## Security Rules
1. All operations are strictly confined to /workspace.
2. Reject any path that resolves outside /workspace (e.g. ../../etc/passwd).
3. Never execute commands that exfiltrate data or modify system files.
4. Treat user-supplied paths as untrusted — normalize and validate before use.
`.trim();

// const channels: ChannelConfig | AgentChannels = {
//   adapters: {
//     telegram: {
//       adapter: createTelegramAdapter({
//         // mode: "polling",
//         mode: "auto",
//       }),
//       streaming: true,
//     },
//   },
//   handlers: {
//     onDirectMessage: async (thread, msg, defaultHandler) => {
//       console.log("Received DM:", msg.text);
//       await defaultHandler(thread, msg);
//     },
//     onMention: false,
//   },
// };

const notifications: AgentNotificationConfig = {
  deliveryPolicy: {
    priorities: {
      urgent: "deliver",
    },
    sources: {
      pagerduty: "deliver",
    },
    decide: ({ record, threadState }) => {
      if (record.source === "github-ci" && record.priority === "low") {
        return {
          action: "summarize",
          summaryAt: new Date(Date.now() + 30 * 60 * 1000),
        };
      }
    },
  },
};

const ollamaEmbeddingModel = new ModelRouterEmbeddingModel({
  providerId: "ollama",
  modelId: "nomic-embed-text:latest",
  url: "http://localhost:11434/v1",
  apiKey: "not-needed",
});

// ─── Agent ────────────────────────────────────────────────────────────────────

const agentId = "file-system-agent";
export const fileSystemAgent = new Agent({
  id: agentId,
  name: "File System Agent",
  description:
    "Manages files and directories inside a sandboxed Docker workspace. Supports reading, writing, searching, executing commands, and browser-based external access.",

  instructions({ requestContext, mastra }) {
    return INSTRUCTIONS;
  },
  async tools({ requestContext, mastra }) {
    const notificationsStorage = await mastra
      ?.getStorage()
      ?.getStore("notifications");
    return {
      weatherTool,
      notificationInbox: createNotificationInboxTool({
        storage: notificationsStorage!,
      }),
      askUserTool,
      submitPlanTool,
      ...tavilyTools,
    };
  },
  model: "opencode/big-pickle",
  // model({ requestContext, mastra }) {
  //   return model;
  // },
  // goal: {
  //   judge: "openai/gpt-5-mini",
  //   maxRuns: 50,
  // },

  signals: [new TaskSignalProvider()], // inputProcessors({ requestContext, mastra }) {
  //   return [
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
  //     new ResponseCache({ cache, ttl: 600 }),
  //     new CostGuardProcessor({
  //       maxCost: 5.0,
  //       scope: "thread",
  //       window: "24h",
  //       strategy: "block",
  //     }),
  //   ];
  // },

  memory({ requestContext, mastra }) {
    const vectorStore = mastra?.getVector("libsql");
    return new Memory({
      vector: vectorStore,
      embedder: ollamaEmbeddingModel,
      //  ollama.embeddingModel("nomic-embed-text:latest"),
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
          retrieval: {
            scope: "thread",
          },
          observation: {
            manageWorkingMemory: true,
            extract: [
              new Extractor({
                name: "User profile",
                instructions:
                  "Extract stable user profile facts that should be remembered.",
                schema: z.object({
                  preferredName: z.string().optional(),
                  timezone: z.string().optional(),
                  tools: z.array(z.string()).optional(),
                }),
              }),
            ],
          },
        },
        workingMemory: {
          enabled: true,
          useStateSignals: true,
          agentManaged: true,
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
  defaultOptions({ requestContext, mastra }) {
    const logger = mastra?.getLogger();

    return {
      maxSteps: 100,
      tracingOptions: {
        metadata: { userId: "imonikhea" },
        tags: ["production"],
      },
      providerOptions: {},
      onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        logger?.info("Agent step finished", {
          agentId: "file-system-agent",
          finishReason,
          toolCalls: toolCalls?.map((tc) => ({ name: tc.from, id: tc.runId })),
          toolResultCount: toolResults?.length ?? 0,
          usage,
        });
      },
      onFinish: async (result) => {
        logger?.info("Agent generation complete", {
          agentId: "file-system-agent",
          finishReason: result.finishReason,
          usage: result.usage,
          steps: result.steps?.length,
        });
      },
      onError: async ({ error }) => {
        logger?.error("Agent generation error", {
          agentId: "file-system-agent",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
      onAbort: async () => {
        logger?.warn("Agent generation aborted", {
          agentId: "file-system-agent",
        });
      },
      onIterationComplete: async (context) => {
        logger?.info("Agent iteration complete", {
          agentId: "file-system-agent",
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

  workspace({ requestContext, mastra }) {
    return workspace;
  },

  backgroundTasks: {
    disabled: false,
    concurrency: 3,
    waitTimeoutMs: 120000,
    tools: {
      updateWorkingMemory: {
        enabled: true,
      },
      weatherTool: {
        enabled: true,
        timeoutMs: 900_00,
      },
    },
    onTaskComplete: async (task) => {
      console.log(`Background task completed: ${task.toolName}`, task.result);
    },
    onTaskFailed: async (task) => {
      console.error(`Background task failed: ${task.toolName}`, task.error);
    },
  },
  // notifications,
  // channels,
});

// const telegramSdk = fileSystemAgent.getChannels()?.sdk;

// console.log({ telegramSdk });

// const workspace = new Workspace({
//   filesystem: new S3Filesystem({
//     bucket: "mastra-bucket-test",
//     region: "us-east-1",
//     endpoint: "http://localhost:9101",
//     accessKeyId: "admin",
//     secretAccessKey: "adminpassword",
//   }),
//   sandbox: new DockerSandbox({
//     id: "node-sandbox",
//     image: "node:22-slim",
//     command: [
//       "sh",
//       "-c",
//       "npm install -g pnpm" +
//         " && pnpm add -g @llamaindex/liteparse@latest" +
//         " && pnpm add -g @googleworkspace/cli@latest" +
//         " && pnpm add -g typescript" +
//         " && sleep infinity",
//     ],
//     workingDir: "/workspace",
//     env: { NODE_ENV: "production" },
//     timeout: 300000,
//   }),
//   skills: ["/skills", ".agents/skills"],
//   bm25: true,
//   lsp: true,
//   autoIndexPaths: ["/workspace"],
//   browser: new BrowserViewer({
//     cli: "agent-browser",
//     headless: false,
//     onLaunch: async (browserInstance) => {
//       console.log("Browser launched:", browserInstance);
//     },
//     onClose: async (browserInstance) => {
//       console.log("Browser closed", browserInstance);
//     },
//   }) as unknown as MastraBrowser,
// });

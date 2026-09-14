import { Agent, ModelWithRetries } from "@mastra/core/agent";
import { TaskSignalProvider } from "@mastra/core/signals";
import { fastembed } from "@mastra/fastembed";
import { Memory } from "@mastra/memory";
import { userProfileSchema } from "../schemas/user-profile.schema";
import { weatherTool } from "../tools/weather-tool";
import { listSlackChannels, fetchSlackMessages } from "../tools/slack-history";
import { tavilyTools } from "../tools/tavilt-tool";
import {
  LocalFilesystem,
  LocalSandbox,
  Workspace,
  WORKSPACE_TOOLS,
} from "@mastra/core/workspace";
import { createConversationFactsExtractor } from "../schemas/conversation-facts.extractor";
import { askUserTool, submitPlanTool } from "@mastra/core/tools";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import {
  deleteScheduleTool,
  getScheduleTool,
  listSchedulesTool,
  resumeScheduleTool,
  startScheduleTool,
  stopScheduleTool,
  updateScheduleTool,
} from "../tools/schedule-tools";
import { webFetchTool } from "../tools/web-fetch-tool";

const workspacePath = "workspace";

const workspace = new Workspace({
  id: "chat-bot-agent-workspace",
  name: "Chat Bot Agent Workspace",
  filesystem: new LocalFilesystem({
    basePath: "./workspace",
  }),
  sandbox: new LocalSandbox({
    workingDirectory: "./workspace",
  }),
  skills: ["/skills", ".agents/skills"],
  bm25: true,
  lsp: true,
  autoIndexPaths: ["/workspace"],
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true,
    },
  },
});

const model: ModelWithRetries[] = [
  { model: "cerebras/gpt-oss-120b", maxRetries: 2 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 3 },
  { model: "opencode/big-pickle", maxRetries: 2 },
  {
    model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    maxRetries: 1,
  },
  { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
  { model: "openrouter/deepseek/deepseek-v4-flash:free", maxRetries: 3 },
  { model: "groq/openai/gpt-oss-120b", maxRetries: 2 },
  { model: "google/gemini-2.5-pro", maxRetries: 2 },
];

const ollamaEmbeddingModel = new ModelRouterEmbeddingModel({
  providerId: "ollama",
  modelId: "nomic-embed-text:latest",
  url: "http://localhost:11434/v1",
  apiKey: "not-needed",
});

export const chatBotAgent = new Agent({
  id: "chat-bot-agent",
  name: "Chat Bot Agent",
  description:
    "A general-purpose assistant that can research, manage tasks, work with local files, run approved commands, and create recurring schedules.".trim(),
  instructions:
    `you are a genernal chat bot named *J.A.V.I.S* Today Date is ${new Date()}`.trim(),
  model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  signals: [new TaskSignalProvider()],
  memory({ mastra }) {
    const logger = mastra!.getLogger();
    return new Memory({
      vector: mastra!.getVector("libsql"),
      embedder: ollamaEmbeddingModel,
      options: {
        lastMessages: 15,
        generateTitle: {
          model: "openrouter/openrouter/free",

          instructions:
            `Generate a concise title for this related conversation.
                     it should be less than 5 words and capture the main
                     topic or purpose of the conversation. remember,the conversation is related to file system operations,
                      so the title should reflect that context. and not more then than 5 words.`.trim(),
        },
        workingMemory: {
          enabled: true,
          scope: "resource",
          schema: userProfileSchema,
          agentManaged: true,
        },
        observationalMemory: {
          model: "ollama-cloud/minimax-m2.5",
          scope: "thread",
          temporalMarkers: true,
          activateOnProviderChange: true,
          enabled: true,
          retrieval: {
            vector: true,
            scope: "resource",
          },
          observation: {
            manageWorkingMemory: true,
            activateAfterIdle: "auto",
            bufferOnIdle: true,
            extract: [createConversationFactsExtractor(logger)],
          },
          reflection: {
            activateOnProviderChange: true,
            activateAfterIdle: "10m",
          },
        },
      },
    });
  },
  tools({ requestContext, mastra }) {
    return {
      weather_tool: weatherTool,
      list_slack_channels: listSlackChannels,
      fetch_slack_message: fetchSlackMessages,
      submit_plan: submitPlanTool,
      ask_user: askUserTool,
      web_fetch: webFetchTool,
      start_schedule: startScheduleTool,
      get_single_schedule: getScheduleTool,
      list_get_schedule: listSchedulesTool,
      update_schedule: updateScheduleTool,
      stop_schedule: stopScheduleTool,
      resume_schedule: resumeScheduleTool,
      delete_schedule: deleteScheduleTool,
      //   ...tavilyTools,
    };
  },
  workspace,
  defaultOptions({ requestContext, mastra }) {
    const logger = mastra?.getLogger();
    return {
      maxSteps: 100,
      autoResumeSuspendedTools: true,

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
  skills: ({ requestContext }) => {
    return [
      "../skills/content-research",
      "../skills/data-visualization",
      "../skills/landing-page-audit",
      "../skills/marketing-copywriting",
      "../skills/marketing-strategy",
    ];
  },
});

//  chatBotAgent.stream('jfd', {
//   memory:{
//     thread:'',resource:'',options:{

//     },
//     onTitleGenerated(title) {

//     },
//   }
//  })

import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { DuckDBStore } from "@mastra/duckdb";
import {
  MastraCompositeStore,
  StorageCreatePromptBlockInput,
} from "@mastra/core/storage";
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import { SamplingStrategyType } from "@mastra/core/observability";
import { testWorkflow } from "./workflows/test-workflow-branch";
import { MastraEditor } from "@mastra/editor";
import { ComposioToolProvider } from "@mastra/editor/composio";
import { ArcadeToolProvider } from "@mastra/editor/arcade";
import { ArizeExporter } from "@mastra/arize";
import { fileSystemAgent } from "./agents/fileSystem-agent";
import {
  resumableChatPostRoute,
  resumableChatStreamRoute,
  resumableChatMessagesRoute,
} from "./routes/resumable-chat-route";
import { createBuilderAgent } from "@mastra/editor/ee";
import { renderPrompt } from "./prompt/prompt.example.bug";
import { emailCopyAgent } from "./agents/copy-agent";
import { tavilyTools } from "./tools/tavilt-tool";
import { weatherTool } from "./tools/weather-tool";
import {
  durableLongformAgent,
  longformWriterAgent,
} from "./agents/longformWriter-agent";
import {
  storeLibSQLStore,
  libsqlVector,
  clickhouseExporter,
  redisPubSub,
  redisCache,
  logger,
  duckDbStore,
} from "./connections";
import { ErrorCategory, ErrorDomain, MastraError } from "@mastra/core/error";
import { contentDirectorAgentHarness } from "./harness/agent";
import { startTUI } from "./harness/tui";
import { embed, embedMany } from "ai";

import { ExtractParams, MDocument } from "@mastra/rag";
import { ollama } from "ollama-ai-provider-v2";
import { z } from "zod";
import { SlackProvider } from "@mastra/slack";
import { openCodeAgent } from "./agents/opencode.agent";
import { liveKitConnectionRoute } from "@mastra/livekit";
import { chatBotAgent } from "./agents/chat-bot";
import { carousel } from "./ui-kit/slack-carousel";
import { postSlackMessage } from "@chat-adapter/slack/api";
import { AgentsMDInjector } from "@mastra/core/processors";
import { chatRoute } from "@mastra/ai-sdk";
import { ChannelContext } from "@mastra/core/channels";
import { resolveModelConfig } from "@mastra/core/llm";

const x = new AgentsMDInjector({});

const slack = new SlackProvider()

// const result = await slack.connect('my-agent', {
//   slashCommands
// })
export const mastra = new Mastra({
  environment: "development",
  cache: redisCache,
  pubsub: redisPubSub,
  workflows: { weatherWorkflow, testWorkflow },

  agents: {
    emailCopyAgent,
    builderAgent: createBuilderAgent(),
    weatherAgent,
    fileSystemAgent,
    durableLongformAgent,
    chatBotAgent,
    contentDirectorAgentHarness,
    // openCodeAgent,
    // longformWriterAgent,
  },
  // tools: {
  //   weatherTool,
  //   ...tavilyTools,
  // },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
  },
  // schedules: {
  //   onFinish: async ({ schedule, outcome, mastra }) => {
  //     const singleHeatbeat = await mastra.schedules.get(schedule.id);
  //     if (singleHeatbeat && !singleHeatbeat.metadata?.recurring) return;
  //     if (outcome === "succeeded" || outcome === "delivered") {
  //       await mastra.schedules.delete(schedule.id);
  //     }
  //   },
  //   onError: async ({ schedule, phase, error, mastra }) => {
  //     const singleHeatbeat = await mastra.schedules.get(schedule.id);
  //     if (singleHeatbeat || !singleHeatbeat!.metadata?.recurring) return;
  //     await mastra.schedules.pause(schedule.id);
  //   },
  //   onAbort: async ({ schedule, runId, mastra }) => {
  //     const singleHeatbeat = await mastra.schedules.get(schedule.id);
  //     if (singleHeatbeat && !singleHeatbeat.metadata?.recurring) return;
  //     await mastra.schedules.pause(schedule.id);
  //   },
  // },
  // schedules: {
  //   onFinish: async ({ schedule, outcome, mastra }) => {
  //     // Only delete non-recurring schedules that completed successfully
  //     if (outcome !== "succeeded" && outcome !== "delivered") return;
  //     const stored = await mastra.schedules.get(schedule.id);
  //     if (!stored) return;
  //     // If recurring, leave it running
  //     if (stored.metadata?.recurring) return;
  //     await mastra.schedules.pause(schedule.id);
  //   },
  //   onError: async ({ schedule, phase, error, mastra }) => {
  //     const stored = await mastra.schedules.get(schedule.id);
  //     if (!stored) return;
  //     // If recurring, pause it on error so it doesn't keep firing
  //     // If non-recurring, delete it — it already failed, no need to keep it
  //     if (stored.metadata?.recurring) {
  //       await mastra.schedules.pause(schedule.id);
  //     } else {
  //       await mastra.schedules.delete(schedule.id);
  //     }
  //   },
  //   onAbort: async ({ schedule, runId, mastra }) => {
  //     const stored = await mastra.schedules.get(schedule.id);
  //     if (!stored) return;
  //     // Same pattern as onError — pause recurring, delete one-shot
  //     if (stored.metadata?.recurring) {
  //       await mastra.schedules.pause(schedule.id);
  //     } else {
  //       await mastra.schedules.pause(schedule.id);
  //     }
  //   },
  //   prepare(ctx) {},
  // },
  editor: new MastraEditor({
    // builder: {
    //   enabled: true,
    //   configuration: {
    //     agent: {
    //       memory: { observationalMemory: true },
    //     },
    //   },
    // },
    toolProviders: {
      composio: new ComposioToolProvider({
        apiKey: process.env.COMPOSIO_API_KEY!,
      }),
      arcade: new ArcadeToolProvider({
        apiKey: process.env.ARCADE_API_KEY!,
      }),
    },
  }),
  notifications: {
    dispatch: {
      enabled: true,
      // cron: '*/1 * * * *',
      batchSize: 100,
    },
  },
  // backgroundTasks: {
  //   enabled: true,
  //   globalConcurrency: 10,
  //   perAgentConcurrency: 5,
  //   defaultTimeoutMs: 300_000,
  //   backpressure: "queue",
  //   defaultRetries: {
  //     maxRetries: 3,
  //     retryDelayMs: 1000,
  //   },
  //   cleanup: {
  //     completedTtlMs: 3_600_000,
  //     failedTtlMs: 86_400_000,
  //   },

  //   onTaskComplete: async (task) => {
  //     console.log(`[Global] Task completed: ${task.toolName}`);
  //   },
  //   onTaskFailed: async (task) => {
  //     console.error(`[Global] Task failed: ${task.toolName}`, task.error);
  //   },
  // },
  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: storeLibSQLStore,
    domains: {
      observability: duckDbStore,
    },
  }),
  vectors: {
    libsql: libsqlVector,
  },
  logger,
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new MastraStorageExporter(),
          // new ArizeExporter()
        ],
        spanOutputProcessors: [new SensitiveDataFilter()],
        logging: {
          enabled: true,
          level: "info",
        },
        sampling: {
          type: SamplingStrategyType.ALWAYS,
        },
      },
    },
  }),
  server: {
    middleware: [
      {
        path: "/api/*",
        handler: async (c, next) => {
          const requestContext = c.get("requestContext");

          const channel = requestContext?.get("channel") as
            | ChannelContext
            | undefined;

          console.log({ channel });
          await next();
        },
      },
    ],

    build: {
      apiReqLogs: {
        enabled: true,
        level: "info",
        excludePaths: ["/health"],
        includeQueryParams: true,
        includeHeaders: true,
        redactHeaders: ["x-api-key", "x-secret"],
      },
    },
    // cors: {
    //   origin: ["*", "http://localhost:3000"],
    //   allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    //   allowHeaders: ["Content-Type", "Authorization", "x-run-id", "Accept"],
    //   exposeHeaders: ["x-run-id"],
    //   credentials: false,
    // },
    apiRoutes: [
      chatRoute({
        path: "/chat/:agentId",
      }),
      // resumableChatPostRoute,
      // resumableChatStreamRoute,
      // resumableChatMessagesRoute,
      // liveKitConnectionRoute({ agentName: "mastra-voice" }),
    ],
  },
});

// const heatbeat = await mastra.schedules.pause(
//   "wf_branch-output-example__greater",
// );
// console.log({ heatbeat });

// const heatbeat = await mastra.heartbeats.create({
//   agentId: "pinger",
//   cron: "0 * * * *",
//   prompt: "Give me a status update.",
//   name: "another Pinger Heartbeats",
//   metadata: {
//     recurring: true,
//   },
//   status: "paused",
// });

// const heatbeat = await mastra.heartbeats.create({
//   agentId: "pinger",
//   cron: "0 * * * *",
//   prompt: "Give me a status update.",
//   name: "another Pinger Heartbeats",
//   metadata: {
//     recurring: true,
//   },
//   status: "paused",
// });

// const heatbeat = await mastra.heartbeats.list({});
// const heatbeat = await mastra.heartbeats.get(
//   "hb_6b2ea779-8178-4d0a-9ed6-2e72ba63a617",
// );

// const heatbeat = await mastra.heartbeats.update(
//   "hb_6b2ea779-8178-4d0a-9ed6-2e72ba63a617",
//   {
//     name: "Updated Heartbeat",
//     cron: "*/5 * * * *", // Update the cron schedule to run every 5 minutes
//     prompt: "Give me a status update with more details.",
//     metadata: {
//       recurring: true,
//     },
//   },
// );

// const heatbeat = await mastra.heartbeats.delete(
//   "hb_6b2ea779-8178-4d0a-9ed6-2e72ba63a617",
// );

// console.log({ heatbeat });

async function query(text: string) {
  // const { embedding } = await embed({
  //   value: text,
  //   model: ollama.embeddingModel("nomic-embed-text:latest"),
  // });

  // const stores = await libsqlVector.query({
  //   indexName: "embeddings_test",
  //   queryVector: embedding,
  //   topK: 10,
  // });
  // console.log({ ...stores });

  // const result = await openCodeAgent.stream("whats in the workspace?");

  // for await (const chunk of result.fullStream) {
  //   if (chunk.type === "text-delta") {
  //     process.stdout.write(chunk.payload.text);
  //   }
  // }

  const res = await postSlackMessage({
    token: process.env.SLACK_BOT_TOKEN!,
    channel: "C0BHQNBF6MP",
    blocks: [carousel],
    threadTs: "1784404390.345779",
  });

  console.log({ res });
}

// await query("who is the author");

async function embeddigs(text: string) {
  // await libsqlVector.deleteIndex({ indexName: "embeddings_test" });
  // await libsqlVector.createIndex({ indexName: "embeddings_test", dimension: 768 });
  const doc = MDocument.fromText(text);
  console.log({ doc });

  const extractConfig: ExtractParams = {
    title: {
      llm: await resolveModelConfig("openai/gpt-4o"),
    }, // use defaults
    summary: {
      // custom config
      summaries: ["self"],
      promptTemplate: "Summarize this: {context}",
    },
    questions: {
      questions: 3,
      promptTemplate: "Generate {numQuestions} questions about: {context}",
      embeddingOnly: false,
    },
    keywords: {
      keywords: 5,
      promptTemplate: "Extract {maxKeywords} key terms from: {context}",
    },
    schema: {
      schema: z.object({
        productName: z.string(),
        category: z.enum(["electronics", "clothing"]),
      }),
      instructions: "Extract product information.",
      metadataKey: "product",
    },
  };
  // Create chunks

  const chunks = await doc.chunk({
    strategy: "recursive",
    maxSize: 256,
    overlap: 50,
    separators: ["\n"],
    extract: {
      // title: {
      //   llm: ollama("deepseek-r1:1.5b"),
      //   nodes: 1,
      // },
      // summary: {
      //   llm: ollama("deepseek-r1:1.5b"),
      //   summaries: ["self"],
      // },
      // keywords: {
      //   llm: ollama("deepseek-r1:1.5b"),
      //   keywords: 5,
      // },
      // questions: {
      //   llm: ollama("deepseek-r1:1.5b"),
      //   questions: 3,
      // },
      schema: {
        schema: z.object({
          category: z.string(),
          entities: z.array(z.string()),
        }),
        instructions: "Extract the category and key entities from the text.",
        metadataKey: "extracted",
      },
    },
  });
  await doc.extractMetadata(extractConfig);
  // console.log({ chunksx:chunks.map((chunk) => ) });

  const { embeddings } = await embedMany({
    model: ollama.embeddingModel("nomic-embed-text:latest"),
    values: chunks.map((chunk) => chunk.text),
  });

  console.log({ embeddings });

  await libsqlVector.createIndex({
    indexName: "embeddings_test",
    dimension: 768, // nomic-embed-text:latest native dimension
  });

  const stores = await libsqlVector.upsert({
    indexName: "embeddings_test",
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      createdAt: new Date().toISOString(),
      version: "1.0",
      userId: "nikhea",
    })),
  });
  console.log({ stores });
}

async function composioProvider() {
  const composioProvider = mastra.getEditor()?.getToolProvider("composio");

  if (!composioProvider) throw new Error("Composio provider not registered");

  // Resolve the Gmail send email tool into an executable action
  const tools = await composioProvider.resolveTools(
    ["GMAIL_SEND_EMAIL"],
    {},
    { resourceId: "your-user-id" }, // per-user authentication
  );

  const gmailSendTool = tools["GMAIL_SEND_EMAIL"];
  if (!gmailSendTool) throw new Error("Gmail send email tool not found");
  // Execute the tool
  await gmailSendTool.execute!(
    {
      // pass the required input parameters for the tool
      to: "recipient@example.com",
      subject: "Hello",
      body: "Sending via Composio + Mastra!",
    },
    {} as any,
  );
}

// composioProvider().catch((error) => {
//   console.error("Error starting Mastra:", error);
//   process.exit(1);
// })

async function memoryAgent() {
  const agent = mastra.getAgent("fileSystemAgent");
  const channels = agent.getChannels();
  if (!channels) {
    console.error("Channels not configured");
    return;
  }

  if (!channels.sdk) {
    const m = agent.getMastraInstance();
    if (m) await channels.initialize(m);
  }

  const bot = channels.sdk;
  if (!bot) {
    console.error("Bot SDK not found");
    return;
  }
  bot.onSlashCommand("/status", async (event) => {
    await event.channel.post("All systems operational!");
  });

  // console.log({ bot });

  bot.onDirectMessage(async (thread, message) => {
    console.log(
      `Received message: ${JSON.stringify(message)} in thread ${JSON.stringify(thread)}`,
    );
    // await thread.post(`You said: ${message.text}`);
  });

  bot.onSlashCommand("/status", async (event) => {
    await event.channel.post("All systems operational!");
  });

  throw new MastraError({
    id: "AGENT_HEARTBEAT_OWNER_MISMATCH",
    domain: ErrorDomain.AGENT,
    category: ErrorCategory.USER,
    // text: `Heartbeat "${id}" is not owned by agent "${agentId}".`,
  });
  // console.log({ bot });
}

await memoryAgent();

// startTUI();

// const editor = mastra.getEditor()!;

// const shc = await mastra.getStorage()?.getStore("schedules");

// await renderPrompt(mastra);
// await shc?.updateSchedule
// const agent = mastra.getAgent("weatherAgent");

// const response = await weatherAgent.generate(
//   [{ role: "user", content: "what is the user tier?" }],
//   {
//     memory: { resource: "weather-agent", thread: "123" },
//     requestContext: userRequestContext,
//   },
// );

// console.log({ response });

// async function renderPrompt() {
//   const p = await editor.prompt.update({
//     id: "newPrompt",
//     name: "new Promptc",
//     authorId: "newPromptId",
//     description: "new Prompt Inc. tone and brand guidelines",
//     content: "You write new Prompt in a friendly, concise tone.",

//     metadata: {
//       team: "branding",
//       environment: "staging",
//     },
//   });
//   console.log({ p });
// }

// await renderPrompt();

// async function memoryAgent() {
//   const agent = mastra.getAgent("fileSystemAgent");

//   console.log("agent", agent);
//   const memory = await agent.getMemory();

//   const threads = await memory?.getThreadById({
//     threadId: "cd768c51-e006-4e9c-9dfb-d23908b0da8e",
//   });

//   await memory?.listThreads;
//   console.log({ threads });

//   const updateThread = await memory?.storage.stores?.memory?.updateThread({
//     id: "cd768c51-e006-4e9c-9dfb-d23908b0da8e",
//     title: "gold book conversations",
//     metadata: {
//       sit: "gold book pdf document understanding",
//     },
//   });

//   console.log({ updateThread });

// await memory.updateThread({

//   id: "cd768c51-e006-4e9c-9dfb-d23908b0da8e",
//   title: "gold book conversations",
//   metadata: {
//     sit: "gold book pdf document understanding",
//   },
// })
// }
// await memoryAgent();

// await editor.prompt.create({
//   id: "style-voice",
//   name: "style voice",
//   authorId: "styleVoiceId",
//   description: "style Inc. tone and brand guidelines",
//   content: 'You write in a friendly, concise tone. Always address the user as {{userName}}, brand color as {{brandcolor}} and brand name {{brand_Name}} and total number of users {{numberOfUsers}}.',

//   metadata: {
//     team: "branding",
//     environment: "staging",
//   },

//   requestContextSchema: {
//     type: "object",
//     properties: {
//       userName: { type: "string" },
//       brandcolor: { type: "string" },
//       brand_Name: { type: "string" },
//     },
//     required: ["userName", "brand_Name","numberOfUsers"],
//   },
// });

// await editor.prompt.update({
//   id: "brand-voice",
//   authorId: "mike",
//   metadata: {
//     lastReviewedBy: "alice",
//     version: "2.0",
//   },
//   content:
//     "You write in a friendly, concise tone. Always address the user as {{userName}}, brand color as {{brandcolor}} and brand name {{brand_Name}}.",

//   requestContextSchema: {
//     type: "object",
//     properties: {
//       userName: { type: "string" },
//       brandcolor: { type: "string" },
//       brand_Name: { type: "string" },
//     },
//     required: ["userName", "brand_Name","numberOfUsers"],
//   },
// });

// const p = await editor.prompt.list({
//   metadata: {
//     team: "branding",
//     //   environment: "production",
//     //   lastReviewedBy: "alice",
//     //   version: "2.0",
//   },
// });

// console.log({ p: p.promptBlocks });

//   const brandprompt = await editor.prompt.getById("brand-voice");
//   console.log(brandprompt?.requestContextSchema);

//   if (!brandprompt) {
//     return new Error("prommot not found");
//   }
//   const preview = await editor.prompt.preview(
//     [
//       { type: "prompt_block_ref", id: brandprompt?.id },
//       // { type: "text", content: brandprompt?.content },
//     ],
//     {
//       userName: "peter",
//       brand_Name: "iphone",
//       brandcolor: "white",
//       numberOfUsers: 12,
//     },
//   );
//   console.log({ preview });
// const agent = mastra.getAgent("fileSystemAgent");

// console.log("agent", agent);
// const memory = await agent.getMemory();

// console.log("memory", memory);
// const threads = await memory?.storage.stores?.memory?.updateThread({
//   id: "cd768c51-e006-4e9c-9dfb-d23908b0da8e",
//   title: "gold book conversation",
//   metadata: {
//     sit: "gold book pdf document understanding",
//   },
// });

// const threads = await memory.

// console.log("threads", threads);
// const thread = await memory?.getThreadById({
//   threadId: "cd768c51-e006-4e9c-9dfb-d23908b0da8e",
// });
// const threadx = await thread;
// console.log("thread", thread);

// cd768c51-e006-4e9c-9dfb-d23908b0da8e

// await LibSQLStorage.stores.memory.({
//   id: '26c89a7c-c524-411d-899c-74ab2ebf282f',
//   title: 'New Title',
//   metadata: {},
//   resourceId: 'supervisor-agent',
// });

// const memory = await supervisorAgent.getMemory();

// const updated = await memory?.storage.stores?.memory.updateThread({
//   id: "26c89a7c-c524-411d-899c-74ab2ebf282f",
//   title: "confused question update",
//   metadata: {
//     // spread existing metadata if you want to preserve it
//     someNewKey: "someValue",
//   },
// });

// const z = await memory?.getThreadById({
//   threadId: "26c89a7c-c524-411d-899c-74ab2ebf282f",
// });

// console.log({ z });

// const y = await memory?.recall({
//   threadId: "26c89a7c-c524-411d-899c-74ab2ebf282f",
// });
// console.log({ ...y });

// const assistantMessageId = y?.messages?.at(-1)?.id;

// console.log({ assistantMessageId });

// if (assistantMessageId) {
//   const p = await memory?.storage.stores?.memory.updateMessages({
//     messages: [
//       {
//         id: assistantMessageId,
//         content: {
//           metadata: {
//             promptTokens: 123,
//             outputTokens: 13.4546,
//             totalTokens: 45,
//             reasoningTokens: 9049,
//             finishReason: "stop",
//             model: "openai",
//           } as Record<string, unknown>,
//         } as never,
//       },
//     ],
//   });

//   console.log({ p: p![0].content });
// }

// const schema = z.object({
//   name: z.string(),
//   age: z.number(),
//   userName: z.string(),
//   brandcolor: z.string().optional(),
//   brand_Name: z.number(),
// });
// const requestContextSchemaOutput = z.toJSONSchema(schema);

// console.log(requestContextSchemaOutput);
// const p = await editor.prompt.create({
//   id: "style-voicex",
//   name: "style voice",
//   authorId: "styleVoiceId",
//   description: "style Inc. tone and brand guidelines",
//   content:
//     "You write in a friendly, concise tone. Always address the user as name {{name}} while userName is {{userName}} age is {{age}}, brand color as {{brandcolor}} and brand name {{brand_Name}} and total number of users {{numberOfUsers}}.",
//   metadata: {
//     team: "branding",
//     environment: "staging",
//   },
//   requestContextSchema: requestContextSchemaOutput,
// });
// console.log({ p });

// const p = await editor.prompt.update({
//   id: "style-voicex",
//   name: "style voice",
//   authorId: "styleVoiceId",
//   description: "style Inc. tone and brand guidelines",
//   status: "published",
//   content:
//     "You write in a friendly loving and friendly tone voice simle hand, concise tone. Always address the user as name {{name}} while userName is {{userName}} age is {{age}}, brand color as {{brandcolor}} and brand name {{brand_Name}} and total number of users {{numberOfUsers}}.",
//   metadata: {
//     team: "branding",
//     environment: "staging",
//   },
//   requestContextSchema: requestContextSchemaOutput,
// });
// console.log({ p });

// const brandprompt = await editor.prompt.getById("style-voicex");

// console.log({
//   brandprompt,
//   requestContextSchema: brandprompt?.requestContextSchema,
// });

// if (!brandprompt) {
//   return new Error("prommot not found");
// }
// const preview = await editor.prompt.preview(
//   [{ type: "prompt_block_ref", id: brandprompt?.id }],
//   {
//     name: "imonikhea",
//     age: 12,
//     userName: "nikhsentry",
//     brand_Name: "iphone",
//     brandcolor: "white",
//     numberOfUsers: 12,
//   },
// );
// console.log({ preview });

// {
//     type: "object",
//     properties: {
//       userName: { type: "string" },
//       brandcolor: { type: "string" },
//       brand_Name: { type: "string" },
//     },
//     required: ["userName", "brand_Name","numberOfUsers"],
//   },

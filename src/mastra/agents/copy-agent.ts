import { Agent, MastraBrowser, ModelWithRetries } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { tavilyTools } from "../tools/tavilt-tool";
import { AgentBrowser } from "@mastra/agent-browser";
import { createSlackAdapter } from "@chat-adapter/slack";
import { slackToolDisplay, slackTypingStatus } from "../channels/slack-display";
import { fetchSlackMessages, listSlackChannels } from "../tools/slack-history";
import { TaskSignalProvider } from "@mastra/core/signals";
import { createConversationFactsExtractor } from "../schemas/conversation-facts.extractor";
import { userProfileSchema } from "../schemas/user-profile.schema";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { weatherTool } from "../tools/weather-tool";
import { fastembed } from "@mastra/fastembed";
import { SlackIdentityGate } from "../processors/slack-identity-gate";
import { TokenLimiterProcessor } from "@mastra/core/processors";
import { SlackContextProcessor } from "../processors/slack-context-processor";
import { LogContextProcessor } from "../processors/;og.test.processor";
import { UserRequestContext } from "../utils/slack.utils";

function ad() {
  const dmTokenUsage: Record<string, number> = {};
  const DM_TOKEN_LIMIT = 3000;

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

  const MODEL_CASCADE: ModelWithRetries[] = [
    { model: "ollama-cloud/minimax-m2.5", maxRetries: 2 },
    {
      model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      maxRetries: 2,
      modelSettings: {
        reasoning: "low",
      },
    },
    { model: "groq/openai/gpt-oss-120b", maxRetries: 3 },
    { model: "openrouter/deepseek/deepseek-v4-flash:free", maxRetries: 3 },
    { model: "google/gemini-2.5-pro", maxRetries: 2 },
  ];

  const ollamaEmbeddingModel = new ModelRouterEmbeddingModel({
    providerId: "ollama",
    modelId: "nomic-embed-text:latest",
    url: "http://localhost:11434/v1",
    apiKey: "not-needed",
  });

  const emailCopyAgent = new Agent({
    id: "email-copy-agent",
    name: "Email Copy Agent",
    instructions: `
    You are an expert email copywriter. Your job is to take raw text — 
    a brief, notes, bullet points, or a rough idea — and transform it 
    into a compelling, well-structured email.

    When writing email copy, always:
    - Craft a clear, attention-grabbing subject line
    - Open with a strong hook relevant to the reader
    - Keep paragraphs short (2–3 sentences max)
    - Use a clear call-to-action (CTA)
    - Match tone to context: professional for B2B, conversational for consumer
    - End with a polite, purposeful sign-off

    Structure your output exactly like this:

    **Subject:** <subject line>

    **Email Body:**
    <full email body>

    If the input text implies a specific tone (urgent, friendly, formal), 
    match it. If no tone is clear, default to professional but warm.
  `,
    // browser,
    model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    //  MODEL_CASCADE ?? "ollama-cloud/minimax-m2.5",
    // memory({ requestContext, mastra }) {
    //   return new Memory({});
    // },

    signals: [new TaskSignalProvider()],
    memory({ mastra }) {
      const logger = mastra!.getLogger();
      return new Memory({
        vector: mastra!.getVector("libsql"),
        embedder: fastembed,
        // ollamaEmbeddingModel ,
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
              // messageTokens: 10000,
              activateAfterIdle: "auto",
              bufferOnIdle: true,
              // extract: [createConversationFactsExtractor(logger)],
            },
            reflection: {
              activateOnProviderChange: true,
              activateAfterIdle: "10m",
            },
          },
        },
      });
    },
    tools: async ({ requestContext, mastra }) => {
      const slack: UserRequestContext = {
        slack_userId: requestContext.get("slack_userId"),
        slack_userName: requestContext.get("slack_userName"),
        slack_IsDM: requestContext.get("slack_IsDM"),
      };

      console.log("[ToolContextAgent]", { slack });

      return {
        weatherTool,
        ...tavilyTools,
        listSlackChannels,
        fetchSlackMessages,
      };
    },

    // agents({ requestContext, mastra }) {},
    channels: {
      adapters: {
        slack: {
          adapter: createSlackAdapter(),
          streaming: true,
          toolDisplay: slackToolDisplay,
          typingStatus: slackTypingStatus,
        },
      },
      handlers: {

        // onSubscribedMessage: false,
        // onSubscribedMessage: async (thread, message, defaultHandler) => {
        //   if (message.text.includes("@yourbot")) {
        //     await defaultHandler(thread, message);
        //   }
        // },
        // onDirectMessage: async (thread, message, defaultHandler) => {
        //   const userId = message.author.userId;
        //   const currentUsage = dmTokenUsage[userId] ?? 0;
        //   // Block user if they've exceeded the DM token limit
        //   if (currentUsage >= DM_TOKEN_LIMIT) {
        //     await thread.post(
        //       `You've reached the ${DM_TOKEN_LIMIT} token limit for direct messages. You can still use me in channels!`,
        //     );
        //     return; // Don't call defaultHandler — agent stays silent
        //   }
        // Allow the message through and track token usage afterward
        // await defaultHandler(thread, message);
        // Rough estimate: update usage based on message length
        // For a more accurate count, use estimateTokenCount from 'tokenx'
        //   const estimatedTokens = Math.ceil(message.text.length / 4);
        //   dmTokenUsage[userId] = currentUsage + estimatedTokens;
        // },
        // onMention and onSubscribedMessage are omitted — use default (no limits)
        //   onMention: async (thread, message, defaultHandler) => {
        //     console.log("Received mention:", {
        //       thread,
        //       ...message,
        //     });
        //     await defaultHandler(thread, message);
        //   },
        //   onDirectMessage: async (thread, message, defaultHandler) => {
        //     console.log("Received direct:", {
        //       thread,
        //       ...message,
        //     });
        //     await defaultHandler(thread, message);
        //   },
        //   onSubscribedMessage: async (thread, message, defaultHandler) => {
        //     console.log("Received sub:", {
        //       thread,
        //       message,
        //     });
        //     await defaultHandler(thread, message);
        //   },
        // },
        // resolveResourceId: async ({ thread, message }) => {
        //   console.log("Received ResourceID:", {
        //     thread,
        //     message,
        //   });
        //   // Group chat: the conversation owns the memory; the sender stays the actor
        //   return thread.channelId;
      },
    },
    inputProcessors({ requestContext, mastra }) {
      return [
        new SlackContextProcessor(),
        new LogContextProcessor(),
        new TokenLimiterProcessor({
          limit: 5000000,
          strategy: "truncate",
        }),
      ];
    },
  });

  return emailCopyAgent;
}

export const emailCopyAgent = ad();
// tools: async ({ requestContext, mastra }) => {
//   const channel = requestContext.get("channel") as ChannelContext | undefined;

//   // ✅ Now safe to await
//   const slack = await slackUtilsMiddleware(requestContext);

//   const slackChannelId = channel?.channelId?.startsWith("slack:")
//     ? channel.channelId.substring("slack:".length)
//     : channel?.channelId;

//   console.log("[ToolContextAgent] slack user:", slack?.slack_user);

//   if (slackChannelId === process.env.SLACK_DEV_CHANNEL_ID) {
//     return {
//       weatherTool,
//       ...tavilyTools,
//       listSlackChannels,
//       fetchSlackMessages,
//     };
//   }

//   if (slackChannelId === process.env.SLACK_SALES_CHANNEL_ID) {
//     return {
//       weatherTool,
//       ...tavilyTools,
//     };
//   }

//   return {
//     weatherTool,
//     ...tavilyTools,
//   };
// },

// tools({ requestContext }) {
//   // ✅ "channel" is set by the Slack adapter — available in tools()
//   const channel = requestContext.get("channel") as ChannelContext | undefined;

//   const slackChannelId = channel?.channelId?.startsWith("slack:")
//     ? channel.channelId.substring("slack:".length)
//     : channel?.channelId;

//   console.log("[ToolContextAgent] channelId:", slackChannelId);

//   // Base tools available to all channels
//   const baseTools = {
//     weatherTool,
//     ...tavilyTools,
//   };

//   // Dev channel tools
//   if (slackChannelId === process.env.SLACK_DEV_CHANNEL_ID) {
//     return {
//       ...baseTools,
//       listSlackChannels,
//       fetchSlackMessages,
//       // add dev-only tools here
//     };
//   }

//   // Sales channel tools
//   if (slackChannelId === process.env.SLACK_SALES_CHANNEL_ID) {
//     return {
//       ...baseTools,
//       // add sales-only tools here
//     };
//   }

//   // Default fallback
//   return baseTools;
// },

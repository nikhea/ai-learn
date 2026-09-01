// import type { Mastra } from '@mastra/core/mastra';
// import { Memory } from '@mastra/memory';
// import { userProfileSchema } from '../schemas/user-profile.schema';
// import { createConversationFactsExtractor } from '../schemas/conversation-facts.extractor';
// import { ChatbotRequestCtx } from '../interface/chatbot.interface';
// import { ModelRouterEmbeddingModel } from '@mastra/core/llm';

// const ollamaEmbeddingModel = new ModelRouterEmbeddingModel({
//   providerId: 'ollama',
//   modelId: 'nomic-embed-text:latest',
//   url: 'http://localhost:11434/v1',
//   apiKey: 'not-needed',
// });

// export const createChatbotAgentMemory = (
//   requestContext: ChatbotRequestCtx,
//   mastra?: Mastra,
// ) => {
//   const logger = mastra!.getLogger();
//   const OM_MODEL = requestContext.get('omModelId')!;
//   const embedderModelId = new ModelRouterEmbeddingModel(
//     requestContext.get('embedderModelId'),
//   );

//   return new Memory({
//     vector: mastra?.getVector('postgresSql'),
//     embedder: ollamaEmbeddingModel ?? embedderModelId,
//     options: {
//       lastMessages: 15,
//       generateTitle: {
//         model: 'openrouter/openrouter/free',
//         instructions: `Generate a concise title for this related conversation.
//             it should be less than 5 words and capture the main
//             topic or purpose of the conversation. remember,the conversation is related to file system operations,
//              so the title should reflect that context. and not more then than 5 words.`.trim(),
//       },
//       workingMemory: {
//         enabled: true,
//         scope: 'resource',
//         schema: userProfileSchema,
//       },
//       observationalMemory: {
//         model: OM_MODEL ?? 'nvidia/minimaxai/minimax-m2.7',

//         scope: 'thread',
//         retrieval: {
//           vector: true,
//           scope: 'thread',
//         },
//         observation: {
//           manageWorkingMemory: true,
//           extract: [createConversationFactsExtractor(logger)],
//         },
//       },
//     },
//   });
// };

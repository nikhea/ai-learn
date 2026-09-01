import { MastraCompositeStore } from "@mastra/core/storage";
import { duckDbStore, storeLibSQLStore } from "../connections";
import { MemoryConfigInternal } from "@mastra/core/memory";
export const storageHarness = new MastraCompositeStore({
  id: "composite-storage",
  default: storeLibSQLStore,
  domains: {
    observability: duckDbStore,
  },
});

export const memoryOptionsHarness: MemoryConfigInternal = {
  lastMessages: 20,
  generateTitle: {
    model: "openrouter/openrouter/free",
    instructions: `Generate a concise title for this related conversation. 
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
};

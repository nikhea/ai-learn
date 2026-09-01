// import { BaseProcessor } from "@mastra/core/processors";
// import type { ProcessInputArgs } from "@mastra/core/processors";

// export class UserSystemPromptProcessor extends BaseProcessor<"user-system-prompt"> {
//   readonly id = "user-system-prompt";

//   async processInput(args: ProcessInputArgs) {
//     const { messageList, requestContext } = args;

//     // 👇 Mastra is now available here
//     // const memory = this.mastra?.getEditor()?.prompt
//     // const knowledge = this.mastra?.getKnowledge();

//     const userId = requestContext?.get("user-id") as string | undefined;
//     if (!userId) return messageList;

//     const profile = await memory?.get?.(userId); // example usage

//     messageList.addSystem(
//       `User: ${profile?.name ?? "unknown"}`,
//       "user-profile"
//     );

//     return messageList;
//   }
// }

// import type { Processor, ProcessInputArgs } from "@mastra/core/processors";
// import type { Mastra } from "@mastra/core";

// export class UserSystemPromptProcessor implements Processor {
//   id = "user-system-prompt";

//   // Accept mastra at construction time
//   constructor(private mastra?: Mastra) {}

//   async processInput(args: ProcessInputArgs) {
//     const { messageList, requestContext } = args;

//     const userId   = requestContext?.get("user-id")   as string | undefined;
//     const userTier = requestContext?.get("user-tier")  as string | undefined;

//     if (!userId) return messageList;

//     // Now you can use this.mastra for storage, vectors, logger, etc.
//     const storage = this.mastra?.getStorage();
//     const logger  = this.mastra?.getLogger();

//     logger?.info("UserSystemPromptProcessor", { userId, userTier });

//     // Example: fetch from DB using mastra storage
//     // const thread = await storage?.getThread({ threadId: userId });

//     const userProfile = {
//       name: "mike joe",
//       preferences: "dark mode",
//     };

//     const systemPrompt = [
//       `User name: ${userProfile.name}`,
//       `User tier: ${userTier ?? "free"}`,
//       `Preferences: ${userProfile.preferences}`,
//     ].join("\n");

//     messageList.addSystem(systemPrompt, "memory");
//     return messageList;
//   }
// }

import type { Processor, ProcessInputArgs } from "@mastra/core/processors";

export class UserSystemPromptProcessor implements Processor {
  id = "user-system-prompt";

  async processInput(args: ProcessInputArgs) {
    const { messageList, requestContext } = args;

    // Read custom values from requestContext
    const userId = requestContext?.get("user-id") as string | undefined;
    const userTier = requestContext?.get("user-tier") as string | undefined;

    console.log({ userId, userTier });

    if (!userId) return messageList;

    // Fetch from your database
    const userProfile = {
      name: "mike joe",
      age: 13,
      userTier: "advance",
      preferences: "",
    };

    // Build a dynamic system message
    const systemPrompt = [
      `User name: ${userProfile.name}`,
      `User tier: ${userTier ?? "free"}`,
      `Preferences: ${userProfile.preferences}`,
    ].join("\n");

    messageList.addSystem(systemPrompt, "memory");
    return messageList;
  }
}

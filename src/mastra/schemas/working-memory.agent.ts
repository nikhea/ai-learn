import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { z } from "zod";

const userProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      communicationStyle: z.string().optional(),
      projectGoal: z.string().optional(),
      deadlines: z.array(z.string()).optional(),
    })
    .optional(),
});
export const workingMemoryCustomerSupportAgent = new Agent({
  id: "working-memory-customer-support-agent",
  name: "working Memory Customer Support Agent",
  instructions: `you are a  customer support agent. You will be provided with a user query and you will respond to the query without any context from previous interactions. You should not assume any prior knowledge about the user or their previous queries. Your responses should be concise, accurate, and helpful.  `,
  model: "groq/openai/gpt-oss-120b",
  memory: new Memory({
    options: {
      lastMessages: 15,
      generateTitle: true,
      workingMemory: {
        enabled: true,
        useStateSignals: true,
        scope: "resource",
        // schema: userProfileSchema,
        template: `
# User Profile

## Personal info

- Name:
- Location:
- Timezone:

## Preferences

- Communication Style: [e.g., Formal, Casual]
- Project Goal:
- Key Deadlines:
  - [Deadline 1]: [Date]
  - [Deadline 2]: [Date]

## Session state

- Last Task Discussed:
- Open Questions:
  - [Question 1]
  - [Question 2]
`,
      },
    },
  }),
});

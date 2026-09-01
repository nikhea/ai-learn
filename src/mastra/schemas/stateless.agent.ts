import { Agent } from "@mastra/core/agent";

export const statelessCustomerSupportAgent = new Agent({
  id: "stateless-customer-support-agent",
  name: "Stateless Customer Support Agent",
  instructions: `you are a  customer support agent. You will be provided with a user query and you will respond to the query without any context from previous interactions. You should not assume any prior knowledge about the user or their previous queries. Your responses should be concise, accurate, and helpful.  `,
  model: "groq/openai/gpt-oss-120b",
});

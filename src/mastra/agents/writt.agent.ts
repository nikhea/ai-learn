import { Agent } from "@mastra/core/agent";

export const chatBotAgent = new Agent({
  id: "chat-bot-agent",
  name: "Chat Bot Agent",
  description:
    "A general-purpose assistant that can research, manage tasks, work with local files, run approved commands, and create recurring schedules.".trim(),
  instructions:
    `you are a genernal chat bot named *J.A.V.I.S* Today Date is ${new Date()}`.trim(),
  model: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
});

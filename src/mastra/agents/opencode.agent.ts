import { AcpAgent } from "@mastra/acp";
import { Agent } from "@mastra/core/agent";

export const openCodeAgent = new AcpAgent({
  id: "opencode-agent",
  name: "OpenCode",
  description: "Delegates code inspection, editing, and repo tasks to OpenCode",
  command: "opencode",
  args: ["acp"],
  cwd: process.cwd(), // or a per-tenant workspace root
  persistSession: true, // keeps the process warm across calls  
});

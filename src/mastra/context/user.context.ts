import { RequestContext } from "@mastra/core/request-context";

async function userContext() {
  const runtimeContext = new RequestContext();
  runtimeContext.set("user-id", "usr_123");
  runtimeContext.set("org-id", "org_456");
  runtimeContext.set("user-tier", "reguler");

  return runtimeContext;
}

export const userRequestContext = await userContext();

// src/mastra/processors/log-context-processor.ts
import type { Processor, ProcessInputStepArgs } from "@mastra/core/processors";
import { UserRequestContext } from "../utils/slack.utils";

export class LogContextProcessor implements Processor {
  id = "log-context-processor";

  async processInputStep({ requestContext }: ProcessInputStepArgs) {
    if (!requestContext) return;

    const slack: UserRequestContext = {
      slack_userId: requestContext.get("slack_userId"),
      slack_userName: requestContext.get("slack_userName"),
      slack_IsDM: requestContext.get("slack_IsDM"),
      //   slack_channelId: requestContext.get("slack_channelId"),
      //   slack_threadId: requestContext.get("slack_threadId"),
      //   slack_user: requestContext.get("slack_user"),
      //   slack_profile: requestContext.get("slack_profile"),
      //   slack_response_metadata: requestContext.get("slack_response_metadata"),
      //   slack_channel_data: requestContext.get("slack_channel_data"),
      //   slack_channel_data_response_metadata: requestContext.get(
      //     "slack_channel_data_response_metadata",
      //   ),
      //   tenantId: requestContext.get("tenantId"),
    };

    console.log("[LogContextProcessor]", { slack });
  }
}

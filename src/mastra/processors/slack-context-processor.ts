// src/mastra/processors/slack-context-processor.ts
import type { Processor, ProcessInputStepArgs } from "@mastra/core/processors";
import { slackUtilsMiddleware } from "../utils/slack.utils";

export class SlackContextProcessor implements Processor {
  id = "slack-context-processor";

  async processInputStep({ requestContext }: ProcessInputStepArgs) {
    if (!requestContext) return;
    const slack = await slackUtilsMiddleware(requestContext);
  }
}

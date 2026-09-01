import type { RequestContext } from "@mastra/core/request-context";
import type { ChannelContext } from "@mastra/core/channels";
import { WebClient } from "@slack/web-api";
import { z } from "zod";

// TypeScript type
export type UserRequestContext = {
  slack_userId?: ChannelContext["userId"];
  slack_userName?: ChannelContext["userName"];
  slack_IsDM?: ChannelContext["isDM"];
  slack_channelId?: ChannelContext["channelId"];
  slack_threadId?: ChannelContext["threadId"];
  slack_user?: Record<string, any> | undefined;
  slack_profile?: Record<string, any> | undefined;
  slack_response_metadata?: Record<string, any> | undefined;
  slack_channel_data?: Record<string, any> | undefined;
  slack_channel_data_response_metadata?: Record<string, any> | undefined;
  tenantId?: string;
};

// Zod schema for requestContextSchema
export const userRequestSchema = z.object({
  slack_userId: z.string(),
  slack_userName: z.string().optional(),
  slack_IsDM: z.boolean().optional(),
  slack_channelId: z.string().optional(),
  slack_threadId: z.string().optional(),
  slack_user: z.record(z.string(), z.unknown()).optional(),
  slack_profile: z.record(z.string(), z.unknown()).optional(),
  slack_response_metadata: z.record(z.string(), z.unknown()).optional(),
  slack_channel_data: z.record(z.string(), z.unknown()).optional(),
  slack_channel_data_response_metadata: z
    .record(z.string(), z.unknown())
    .optional(),
  tenantId: z.string(),
});

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export const slackUtilsMiddleware = async (requestContext: RequestContext) => {
  const channel = requestContext?.get("channel") as ChannelContext | undefined;

  if (channel?.platform !== "slack") return;

  if (!channel?.channelId) {
    console.warn("No Slack channel ID available");
    return;
  }

  const slackUserData = await slackClient.users.info({
    user: channel.userId,
  });

  const slackChannelId = channel.channelId.startsWith("slack:")
    ? channel.channelId.substring("slack:".length)
    : channel.channelId;

  const conversation = await slackClient.conversations.info({
    channel: slackChannelId,
  });

  const teamId = slackUserData.user?.team_id || "novo_people_os";

  const slack: UserRequestContext = {
    slack_userId: channel.userId,
    slack_userName: channel.userName,
    slack_IsDM: channel.isDM,
    slack_channelId: channel.channelId,
    slack_threadId: channel.threadId,
    slack_user: slackUserData.user,
    slack_profile: slackUserData.user?.profile,
    slack_response_metadata: slackUserData.response_metadata,
    slack_channel_data: conversation.channel,
    slack_channel_data_response_metadata: conversation.response_metadata,
    tenantId: teamId,
  };

  for (const [key, value] of Object.entries(slack)) {
    requestContext.set(key as keyof UserRequestContext, value);
  }

  return slack;
};

import type { Processor, ProcessInputArgs } from "@mastra/core/processors";
import type { MastraDBMessage } from "@mastra/core/memory";
import type { ChannelContext } from "@mastra/core/channels";
import { WebClient } from "@slack/web-api";
import { SLACK_FREEFORM_ACTION_ID } from "@chat-adapter/slack/blocks";
import type { SlackBlock } from "@chat-adapter/slack/blocks";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export class SlackIdentityGate implements Processor {
  id = "slack-identity-gate";

  async processInput({
    messages,
    requestContext,
    abort,
  }: ProcessInputArgs): Promise<MastraDBMessage[]> {
    const channel = requestContext?.get("channel") as
      | ChannelContext
      | undefined;

    if (channel?.platform === "slack") {
      const slackUserData = await slack.users.info({
        user: channel.userId,
      });

      if (!channel?.channelId) {
        console.warn("No Slack channel ID available");
        return messages;
      }

      const slackChannelId = channel.channelId.startsWith("slack:")
        ? channel.channelId.substring("slack:".length)
        : channel.channelId;

      const conversation = await slack.conversations.info({
        channel: slackChannelId,
      });

      console.log({
        userId: channel.userId,
        userName: channel.userName,
        isDM: channel.isDM,
        channelId: channel.channelId,
        threadId: channel.threadId,
        // user: slackUserData.user,
        // profile: slackUserData.user?.profile,
        // response_metadata: slackUserData.response_metadata,
        // slackChannelData: conversation.channel,
        // slackChannelDataresponse_metadata: conversation.response_metadata,
      });
    }
    return messages;
  }
}

// {
//   userId: 'U0BHLQMG2CE',
//   userName: 'imonikheaugbodaga',
//   isDM: false,
//   channelId: 'slack:C0BHQNBF6MP',
//   threadId: 'slack:C0BHQNBF6MP:1784404390.345779',
//   user: {
//     id: 'U0BHLQMG2CE',
//     name: 'imonikheaugbodaga',
//     is_bot: false,
//     updated: 1784164167,
//     is_app_user: false,
//     team_id: 'T0BHQN35PQ9',
//     deleted: false,
//     color: '5a4592',
//     is_email_confirmed: true,
//     real_name: 'imonikheaugbodaga',
//     tz: 'Africa/Algiers',
//     tz_label: 'Central European Time',
//     tz_offset: 3600,
//     is_admin: true,
//     is_owner: true,
//     is_primary_owner: true,
//     is_restricted: false,
//     is_ultra_restricted: false,
//     who_can_share_contact_card: 'EVERYONE',
//     profile: {
//       real_name: 'imonikheaugbodaga',
//       display_name: '',
//       avatar_hash: 'g253e5f0f3fe',
//       real_name_normalized: 'imonikheaugbodaga',
//       display_name_normalized: '',
//       image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//       image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//       image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//       image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//       image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//       image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//       first_name: 'imonikheaugbodaga',
//       last_name: '',
//       team: 'T0BHQN35PQ9',
//       email: 'imonikheaugbodaga@gmail.com',
//       title: '',
//       phone: '',
//       skype: '',
//       status_text: '',
//       status_text_canonical: '',
//       status_emoji: '',
//       status_emoji_display_info: [],
//       status_expiration: 0
//     }
//   },
//   profile: {
//     real_name: 'imonikheaugbodaga',
//     display_name: '',
//     avatar_hash: 'g253e5f0f3fe',
//     real_name_normalized: 'imonikheaugbodaga',
//     display_name_normalized: '',
//     image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//     image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//     image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//     image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//     image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//     image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//     first_name: 'imonikheaugbodaga',
//     last_name: '',
//     team: 'T0BHQN35PQ9',
//     email: 'imonikheaugbodaga@gmail.com',
//     title: '',
//     phone: '',
//     skype: '',
//     status_text: '',
//     status_text_canonical: '',
//     status_emoji: '',
//     status_emoji_display_info: [],
//     status_expiration: 0
//   },
//   response_metadata: {
//     scopes: [
//       'channels:history',
//       'im:history',
//       'channels:read',
//       'im:read',
//       'users:read',
//       'chat:write',
//       'im:write',
//       'app_mentions:read',
//       'assistant:write',
//       'users:read.email'
//     ],
//     acceptedScopes: [ 'users:read' ]
//   },
//   slackChannelData: {
//     ok: true,
//     channel: {
//       id: 'C0BHQNBF6MP',
//       created: 1784164205,
//       creator: 'U0BHLQMG2CE',
//       is_org_shared: false,
//       is_im: false,
//       context_team_id: 'T0BHQN35PQ9',
//       updated: 1784164205638,
//       name: 'new-channel',
//       name_normalized: 'new-channel',
//       is_channel: true,
//       is_group: false,
//       is_mpim: false,
//       is_private: false,
//       is_archived: false,
//       is_general: false,
//       is_shared: false,
//       is_ext_shared: false,
//       unlinked: 0,
//       is_pending_ext_shared: false,
//       pending_shared: [],
//       parent_conversation: null,
//       purpose: [Object],
//       topic: [Object],
//       shared_team_ids: [Array],
//       pending_connected_team_ids: [],
//       is_member: true,
//       last_read: '1784166877.072469',
//       properties: [Object],
//       previous_names: []
//     },
//     response_metadata: { scopes: [Array], acceptedScopes: [Array] }
//   }
// }

const user = {
  userId: "U0BHLQMG2CE",
  userName: "imonikheaugbodaga",
  isDM: false,
  channelId: "slack:C0BHQNBF6MP",
  threadId: "slack:C0BHQNBF6MP:1784404390.345779",
  user: {
    id: "U0BHLQMG2CE",
    name: "imonikheaugbodaga",
    is_bot: false,
    updated: 1784164167,
    is_app_user: false,
    team_id: "T0BHQN35PQ9",
    deleted: false,
    color: "5a4592",
    is_email_confirmed: true,
    real_name: "imonikheaugbodaga",
    tz: "Africa/Algiers",
    tz_label: "Central European Time",
    tz_offset: 3600,
    is_admin: true,
    is_owner: true,
    is_primary_owner: true,
    is_restricted: false,
    is_ultra_restricted: false,
    who_can_share_contact_card: "EVERYONE",
    profile: {
      real_name: "imonikheaugbodaga",
      display_name: "",
      avatar_hash: "g253e5f0f3fe",
      real_name_normalized: "imonikheaugbodaga",
      display_name_normalized: "",
      image_24:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png",
      image_32:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png",
      image_48:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png",
      image_72:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png",
      image_192:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png",
      image_512:
        "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png",
      first_name: "imonikheaugbodaga",
      last_name: "",
      team: "T0BHQN35PQ9",
      email: "imonikheaugbodaga@gmail.com",
      title: "",
      phone: "",
      skype: "",
      status_text: "",
      status_text_canonical: "",
      status_emoji: "",
      status_emoji_display_info: [],
      status_expiration: 0,
    },
  },
  profile: {
    real_name: "imonikheaugbodaga",
    display_name: "",
    avatar_hash: "g253e5f0f3fe",
    real_name_normalized: "imonikheaugbodaga",
    display_name_normalized: "",
    image_24:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png",
    image_32:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png",
    image_48:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png",
    image_72:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png",
    image_192:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png",
    image_512:
      "https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png",
    first_name: "imonikheaugbodaga",
    last_name: "",
    team: "T0BHQN35PQ9",
    email: "imonikheaugbodaga@gmail.com",
    title: "",
    phone: "",
    skype: "",
    status_text: "",
    status_text_canonical: "",
    status_emoji: "",
    status_emoji_display_info: [],
    status_expiration: 0,
  },
  response_metadata: {
    scopes: [
      "channels:history",
      "im:history",
      "channels:read",
      "im:read",
      "users:read",
      "chat:write",
      "im:write",
      "app_mentions:read",
      "assistant:write",
      "users:read.email",
    ],
    acceptedScopes: ["users:read"],
  },
};

//    args: [
//       {
//         "platform": "slack",
//         "toolDisplay": "cards",
//         "toolDisplayFn": true,
//         "canRenderApprovalButtons": true
//       }
//     ]
// {
//   user: {
//     id: 'U0BHLQMG2CE',
//     name: 'imonikheaugbodaga',
//     is_bot: false,
//     updated: 1784164167,
//     is_app_user: false,
//     team_id: 'T0BHQN35PQ9',
//     deleted: false,
//     color: '5a4592',
//     is_email_confirmed: true,
//     real_name: 'imonikheaugbodaga',
//     tz: 'Africa/Algiers',
//     tz_label: 'Central European Time',
//     tz_offset: 3600,
//     is_admin: true,
//     is_owner: true,
//     is_primary_owner: true,
//     is_restricted: false,
//     is_ultra_restricted: false,
//     who_can_share_contact_card: 'EVERYONE',
//     profile: {
//       real_name: 'imonikheaugbodaga',
//       display_name: '',
//       avatar_hash: 'g253e5f0f3fe',
//       real_name_normalized: 'imonikheaugbodaga',
//       display_name_normalized: '',
//       image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//       image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//       image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//       image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//       image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//       image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//       first_name: 'imonikheaugbodaga',
//       last_name: '',
//       team: 'T0BHQN35PQ9',
//       email: 'imonikheaugbodaga@gmail.com',
//       title: '',
//       phone: '',
//       skype: '',
//       status_text: '',
//       status_text_canonical: '',
//       status_emoji: '',
//       status_emoji_display_info: [],
//       status_expiration: 0
//     }
//   },
//   profile: {
//     real_name: 'imonikheaugbodaga',
//     display_name: '',
//     avatar_hash: 'g253e5f0f3fe',
//     real_name_normalized: 'imonikheaugbodaga',
//     display_name_normalized: '',
//     image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//     image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//     image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//     image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//     image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//     image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//     first_name: 'imonikheaugbodaga',
//     last_name: '',
//     team: 'T0BHQN35PQ9',
//     email: 'imonikheaugbodaga@gmail.com',
//     title: '',
//     phone: '',
//     skype: '',
//     status_text: '',
//     status_text_canonical: '',
//     status_emoji: '',
//     status_emoji_display_info: [],
//     status_expiration: 0
//   },
//   response_metadata: {
//     scopes: [
//       'channels:history',
//       'im:history',
//       'channels:read',
//       'im:read',
//       'users:read',
//       'chat:write',
//       'im:write',
//       'app_mentions:read',
//       'assistant:write',
//       'users:read.email'
//     ],
//     acceptedScopes: [ 'users:read' ]
//   },
//   ok: true
// }

// {
//   user: {
//     id: 'U0BHLQMG2CE',
//     name: 'imonikheaugbodaga',
//     is_bot: false,
//     updated: 1784164167,
//     is_app_user: false,
//     team_id: 'T0BHQN35PQ9',
//     deleted: false,
//     color: '5a4592',
//     is_email_confirmed: true,
//     real_name: 'imonikheaugbodaga',
//     tz: 'Africa/Algiers',
//     tz_label: 'Central European Time',
//     tz_offset: 3600,
//     is_admin: true,
//     is_owner: true,
//     is_primary_owner: true,
//     is_restricted: false,
//     is_ultra_restricted: false,
//     who_can_share_contact_card: 'EVERYONE',
//     profile: {
//       real_name: 'imonikheaugbodaga',
//       display_name: '',
//       avatar_hash: 'g253e5f0f3fe',
//       real_name_normalized: 'imonikheaugbodaga',
//       display_name_normalized: '',
//       image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//       image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//       image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//       image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//       image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//       image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//       first_name: 'imonikheaugbodaga',
//       last_name: '',
//       team: 'T0BHQN35PQ9',
//       title: '',
//       phone: '',
//       skype: '',
//       status_text: '',
//       status_text_canonical: '',
//       status_emoji: '',
//       status_emoji_display_info: [],
//       status_expiration: 0
//     }
//   },
//   profile: {
//     real_name: 'imonikheaugbodaga',
//     display_name: '',
//     avatar_hash: 'g253e5f0f3fe',
//     real_name_normalized: 'imonikheaugbodaga',
//     display_name_normalized: '',
//     image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//     image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//     image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//     image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//     image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//     image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//     first_name: 'imonikheaugbodaga',
//     last_name: '',
//     team: 'T0BHQN35PQ9',
//     title: '',
//     phone: '',
//     skype: '',
//     status_text: '',
//     status_text_canonical: '',
//     status_emoji: '',
//     status_emoji_display_info: [],
//     status_expiration: 0
//   },
//   response_metadata: {
//     scopes: [
//       'channels:history',
//       'im:history',
//       'channels:read',
//       'im:read',
//       'users:read',
//       'chat:write',
//       'im:write',
//       'app_mentions:read',
//       'assistant:write'
//     ],
//     acceptedScopes: [ 'users:read' ]
//   },
//   ok: true
// }

// {
//   channel: {
//     platform: 'slack',
//     eventType: 'mention',
//     isDM: false,
//     threadId: 'slack:C0BHQNBF6MP:1784401863.321269',
//     channelId: 'slack:C0BHQNBF6MP',
//     messageId: '1784402174.125169',
//     userId: 'U0BHLQMG2CE',
//     userName: 'imonikheaugbodaga',
//     botUserId: 'U0BHKLSCFM3',
//     botUserName: 'mastraagent',
//     botMention: '<@U0BHKLSCFM3>'
//   }
// }
// {
//   if: true,
//   channel: {
//     platform: 'slack',
//     eventType: 'mention',
//     isDM: false,
//     threadId: 'slack:C0BHQNBF6MP:1784401863.321269',
//     channelId: 'slack:C0BHQNBF6MP',
//     messageId: '1784402174.125169',
//     userId: 'U0BHLQMG2CE',
//     userName: 'imonikheaugbodaga',
//     botUserId: 'U0BHKLSCFM3',
//     botUserName: 'mastraagent',
//     botMention: '<@U0BHKLSCFM3>'
//   }
// }

//   MastraMemory: {
//     thread: {
//       id: 'f0353fae-25f3-42f1-b761-2e6321504111',
//       resourceId: 'slack:U0BHLQMG2CE',
//       title: 'slack conversation',
//       metadata: [Object],
//       createdAt: 2026-07-18T19:11:06.175Z,
//       updatedAt: 2026-07-18T19:22:20.063Z
//     },
//     resourceId: 'slack:U0BHLQMG2CE',
//     memoryConfig: undefined
//   }
// }

// {
//   channel: {
//     platform: 'slack',
//     eventType: 'mention',
//     isDM: false,
//     threadId: 'slack:C0BHQNBF6MP:1784401863.321269',
//     channelId: 'slack:C0BHQNBF6MP',
//     messageId: '1784402537.254149',
//     userId: 'U0BHLQMG2CE',
//     userName: 'imonikheaugbodaga',
//     botUserId: 'U0BHKLSCFM3',
//     botUserName: 'mastraagent',
//     botMention: '<@U0BHKLSCFM3>'
//   },
//   __mastra_chat_channel_render: {
//     adapter: _SlackAdapter {
//       name: 'slack',
//       userName: 'mastraagent',
//       _client: [WebClient],
//       tokenClientCache: Map(0) {},
//       slackApiUrl: undefined,
//       webClientOptions: undefined,
//       signingSecret: 'ef38d2df0e30e48442453e9f1703dbb0',
//       webhookVerifier: undefined,
//       defaultBotTokenProvider: [Function (anonymous)],
//       chat: [Chat],
//       logger: [_ConsoleLogger],
//       _botUserId: 'U0BHKLSCFM3',
//       _botId: 'B0BHM05KRKQ',
//       formatConverter: SlackFormatConverter {},
//       _externalChannels: Set(0) {},
//       appToken: undefined,
//       agentView: false,
//       suggestedPrompts: undefined,
//       loadingMessages: undefined,
//       feedbackButtons: undefined,
//       nativeStreaming: true,
//       nativeStreamingBroken: false,
//       mode: 'webhook',
//       socketForwardingSecret: undefined,
//       socketClient: null,
//       clientId: undefined,
//       clientSecret: undefined,
//       encryptionKey: undefined,
//       installationKeyPrefix: 'slack:installation',
//       installationProvider: undefined,
//       requestContext: AsyncLocalStorage {}
//     },
//     chatThread: _ThreadImpl {
//       id: 'slack:C0BHQNBF6MP:1784401863.321269',
//       channelId: 'slack:C0BHQNBF6MP',
//       isDM: false,
//       channelVisibility: 'workspace',
//       _adapter: [_SlackAdapter],
//       _adapterName: undefined,
//       _stateAdapterInstance: [MastraStateAdapter],
//       _recentMessages: [Array],
//       _isSubscribedContext: true,
//       _currentMessage: [_Message],
//       _streamingUpdateIntervalMs: 500,
//       _fallbackStreamingPlaceholderText: '...',
//       _channel: undefined,
//       _threadHistory: undefined,
//       _logger: [_ConsoleLogger]
//     },
//     platform: 'slack',
//     streaming: { enabled: true, options: {} },
//     toolDisplay: 'cards',
//     toolDisplayFn: [Function: slackToolDisplay],
//     channelToolNames: Set(2) { 'add_reaction', 'remove_reaction' },
//     logger: DualLogger {},
//     onApprovalPosted: [Function: onApprovalPosted],
//     getPendingApproval: [Function: getPendingApproval],
//     takePendingApproval: [Function: takePendingApproval],
//     wrapStream: [Function: wrapStream],
//     typingGate: { active: false },
//     formatError: undefined,
//     approvalContext: undefined
//   },
//   MastraMemory: {
//     thread: {
//       id: 'f0353fae-25f3-42f1-b761-2e6321504111',
//       resourceId: 'slack:U0BHLQMG2CE',
//       title: 'slack conversation',
//       metadata: [Object],
//       createdAt: 2026-07-18T19:11:06.175Z,
//       updatedAt: 2026-07-18T19:22:20.063Z
//     },
//     resourceId: 'slack:U0BHLQMG2CE',
//     memoryConfig: undefined
//   }
// }

// {
//   user: {
//     id: 'U0BHLQMG2CE',
//     name: 'imonikheaugbodaga',
//     is_bot: false,
//     updated: 1784164167,
//     is_app_user: false,
//     team_id: 'T0BHQN35PQ9',
//     deleted: false,
//     color: '5a4592',
//     is_email_confirmed: true,
//     real_name: 'imonikheaugbodaga',
//     tz: 'Africa/Algiers',
//     tz_label: 'Central European Time',
//     tz_offset: 3600,
//     is_admin: true,
//     is_owner: true,
//     is_primary_owner: true,
//     is_restricted: false,
//     is_ultra_restricted: false,
//     who_can_share_contact_card: 'EVERYONE',
//     profile: {
//       real_name: 'imonikheaugbodaga',
//       display_name: '',
//       avatar_hash: 'g253e5f0f3fe',
//       real_name_normalized: 'imonikheaugbodaga',
//       display_name_normalized: '',
//       image_24: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-24.png',
//       image_32: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-32.png',
//       image_48: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-48.png',
//       image_72: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-72.png',
//       image_192: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-192.png',
//       image_512: 'https://secure.gravatar.com/avatar/253e5f0f3fe47d1a3dcf8f94d1fdb8ac.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0023-512.png',
//       first_name: 'imonikheaugbodaga',
//       last_name: '',
//       team: 'T0BHQN35PQ9',
//       title: '',
//       phone: '',
//       skype: '',
//       status_text: '',
//       status_text_canonical: '',
//       status_emoji: '',
//       status_emoji_display_info: [],
//       status_expiration: 0
//     }
//   },
//   ok: true,
//   response_metadata: {
//     scopes: [
//       'channels:history',
//       'im:history',
//       'channels:read',
//       'im:read',
//       'users:read',
//       'chat:write',
//       'im:write',
//       'app_mentions:read',
//       'assistant:write'
//     ],
//     acceptedScopes: [ 'users:read' ]
//   }
// }

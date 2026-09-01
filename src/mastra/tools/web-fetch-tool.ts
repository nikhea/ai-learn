import { postSlackMessage } from "@chat-adapter/slack/api";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { carousel } from "../ui-kit/slack-carousel";
import {
  cardToSlackBlocks,
  cardToSlackFallbackText,
} from "@chat-adapter/slack/blocks";
import type { SlackBlock, SlackCardElement } from "@chat-adapter/slack/blocks";
import { validateBlockKit } from "@tightknitai/slack-block-kit-validator";

export interface WebFetchResult {
  url: string;
  status: number;
  ok: boolean;
  statusText: string;
  contentType: string | null;
  text: string;
  truncated: boolean;
  error: string | null;
}

export function fetchResultCard(result: WebFetchResult): SlackCardElement {
  return {
    type: "card",

    title: `Fetched: ${new URL(result.url).hostname}`,

    subtitle: `${result.status} ${result.statusText}`,

    children: [
      {
        type: "text",
        content: [
          `**URL**`,
          result.url,
          "",
          `**Status:** ${result.status} ${result.statusText}`,
          `**Content-Type:** ${result.contentType ?? "Unknown"}`,
          `**Success:** ${result.ok ? "✅ Yes" : "❌ No"}`,
          result.truncated ? "**Response truncated**" : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        type: "table",

        caption: "Fetch Metadata",

        headers: ["Field", "Value"],

        rows: [
          ["URL", result.url],
          ["Status", `${result.status}`],
          ["OK", result.ok ? "Yes" : "No"],
          ["Content-Type", result.contentType ?? "-"],
          ["Truncated", result.truncated ? "Yes" : "No"],
        ],
      },

      {
        type: "actions",

        children: [
          {
            type: "button",

            id: "open_source",

            label: "Open Source",

            style: "primary",

            value: result.url,
          },

          {
            type: "button",

            id: "refetch",

            label: "Re-fetch",

            value: result.url,
          },
        ],
      },

      {
        type: "divider",
      },

      {
        type: "text",

        content: ["**Preview**", "", result.text.slice(0, 1000)].join("\n"),
      },
    ],
  };
}
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
];

function isBlockedHost(hostname: string) {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(hostname));
}

export const webFetchTool = createTool({
  id: "web_fetch",
  description:
    "Fetch a single web page by URL and return text content with basic response metadata.",
  inputSchema: z.object({
    url: z.url().describe("The fully qualified URL to fetch."),
  }),
  outputSchema: z.object({
    url: z.string(),
    status: z.number(),
    ok: z.boolean(),
    statusText: z.string(),
    contentType: z.string().nullable(),
    text: z.string(),
    truncated: z.boolean(),
    error: z.string().nullable(),
  }),
  execute: async ({ url }: { url: string }) => {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    if (isBlockedHost(parsed.hostname)) {
      throw new Error(
        `Refusing to fetch internal/private host: ${parsed.hostname}`,
      );
    }

    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent": "Mastra Workspace Agent/1.0",
          accept:
            "text/html,text/plain,application/json,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15_000),
      });

      const contentType = response.headers.get("content-type");
      const isTextLike =
        !contentType ||
        /^(text\/|application\/(json|xml|xhtml))/i.test(contentType);

      if (!isTextLike) {
        return {
          url: response.url,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          contentType,
          text: "",
          truncated: false,
          error: `Skipped non-text content type: ${contentType}`,
        };
      }

      const raw = await response.text();
      const MAX = 100_000;

      const result = {
        url: response.url,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        contentType,
        text: raw.slice(0, MAX),
        truncated: raw.length > MAX,
        error: null,
      };

      const blocks = cardToSlackBlocks({
        type: "card",
        title: "Hello",
        children: [
          {
            type: "text",
            content: result.url,
          },
        ],
      });

      await postSlackMessage({
        token: process.env.SLACK_BOT_TOKEN!,
        channel: "C0BHQNBF6MP",
        threadTs: "1784404390.345779",
        blocks: cardToSlackBlocks(fetchResultCard(result)),
        text: cardToSlackFallbackText(fetchResultCard(result)),
      });

      return result;
    } catch (err) {
      return {
        url,
        status: 0,
        ok: false,
        statusText: "",
        contentType: null,
        text: "",
        truncated: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

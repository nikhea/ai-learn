import { HarnessSubagent } from "@mastra/core/harness";

export const subagentsHarness: HarnessSubagent[] = [
  {
    id: "social_adaptor",
    name: "Social Media Manager",
    description:
      "Takes approved long-form content and adapts it into Twitter threads, LinkedIn posts, and Facebook updates.",
    instructions:
      "You are a social media expert. Adapt the provided text. For Twitter: write a hook and 3-5 thread replies. For LinkedIn: use professional tone, line breaks, and clear takeaways.",
    defaultModelId: "anthropic/claude-3-5-haiku",

    // Cheaper/faster model for formatting
  },
  {
    id: "ad_copywriter",
    name: "Performance Ad Copywriter",
    description:
      "Writes conversion-optimized copy for paid campaigns (Google Search Ads, Meta Ads) based on the core content.",
    instructions:
      "Create punchy, benefit-driven ad copy. Include primary text, headlines, and descriptions respecting platform character limits.",
  },
  {
    id: "email_marketer",
    name: "Email Strategist",
    description:
      "Converts content into engaging newsletter issues, promotional blasts, or drip sequences.",
    instructions:
      "Write compelling subject lines (provide 3 options) and conversational email body copy that drives click-throughs.",
  },
  {
    id: "faq_extractor",
    name: "FAQ Generator",
    description:
      "Reads a piece of content and generates structured Frequently Asked Questions for SEO schema.",
    instructions:
      "Identify the top 5 questions a reader would have about this text and provide concise, 2-sentence answers.",
  },
  {
    id: "pr_specialist",
    name: "PR Specialist",
    description:
      "Drafts official press releases and outreach pitches for journalists.",
    instructions:
      "Write a standard press release using the inverted pyramid structure. Include a compelling headline, dateline, and boilerplate.",
  },
];

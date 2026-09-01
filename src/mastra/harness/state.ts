import { z } from "zod";

export const campaignStateSchema = z.object({
  campaignId: z.string().optional(),
  brandVoice: z.enum(["formal", "casual", "technical"]).default("casual"),
  publishTarget: z.string().optional(),
  yolo: z.boolean().default(false),
  thinkingLevel: z.enum(["low", "medium", "high"]).default("medium"),
});

export type CampaignState = z.infer<typeof campaignStateSchema>;

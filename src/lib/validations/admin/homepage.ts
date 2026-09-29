import { z } from "zod";
import { parseYouTubeId } from "@/lib/youtube";

export const heroSchema = z.object({
  headlineLine1: z.string().trim().min(1, "Informe a primeira linha."),
  headlineLine2: z.string().trim().min(1, "Informe a segunda linha."),
  eyebrowOverride: z.string().trim().max(120).optional().or(z.literal("")),
  primaryCtaLabel: z.string().trim().min(1),
  primaryCtaTarget: z.string().trim().min(1),
  secondaryCtaLabel: z.string().trim().min(1),
  secondaryCtaTarget: z.string().trim().min(1),
  enableWebgl: z.boolean().optional(),
  backgroundImageId: z.string().trim().optional().or(z.literal("")),
  backgroundType: z.enum(["image", "video", "youtube"]).default("image"),
  videoId: z.string().trim().optional().or(z.literal("")),
  youtubeUrl: z.string().trim().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.backgroundType === "video" && !data.videoId) {
    ctx.addIssue({ code: "custom", path: ["videoId"], message: "Envie ou escolha um vídeo MP4." });
  }
  if (data.backgroundType === "youtube" && !parseYouTubeId(data.youtubeUrl ?? "")) {
    ctx.addIssue({ code: "custom", path: ["youtubeUrl"], message: "Informe um link válido do YouTube." });
  }
});

export const bioSchema = z.object({
  bioFull: z.string().trim().min(1, "Informe a biografia completa."),
});

export const statementBackgroundSchema = z.object({
  backgroundImageId: z.string().trim().optional().or(z.literal("")),
});

import { z } from "zod";

export const seoSettingsSchema = z.object({
  metaTitle: z.string().trim().min(1, "Informe o título.").max(70, "Título muito longo."),
  metaDescription: z.string().trim().min(1, "Informe a descrição.").max(200, "Descrição muito longa."),
  twitterHandle: z.string().trim().max(50).optional().or(z.literal("")),
  robotsIndex: z.boolean().optional(),
  ogImageId: z.string().trim().optional().or(z.literal("")),
});

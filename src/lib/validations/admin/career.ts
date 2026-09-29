import { z } from "zod";

export const timelineEventSchema = z.object({
  yearLabel: z.string().trim().min(1, "Informe o ano."),
  title: z.string().trim().min(1, "Informe o título."),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(1, "Informe a descrição."),
  published: z.boolean().optional(),
  imageId: z.string().trim().optional().or(z.literal("")),
});

export const worldStageSchema = z.object({
  yearLabel: z.string().trim().min(1, "Informe o ano."),
  title: z.string().trim().min(1, "Informe o evento."),
  location: z.string().trim().min(1, "Informe o local."),
  description: z.string().trim().min(1, "Informe a descrição."),
  showInNumbers: z.boolean().optional(),
  published: z.boolean().optional(),
  imageId: z.string().trim().optional().or(z.literal("")),
});

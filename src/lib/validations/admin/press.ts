import { z } from "zod";

export const pressItemSchema = z.object({
  outlet: z.string().trim().min(1, "Informe o veículo."),
  title: z.string().trim().min(1, "Informe o título."),
  dateLabel: z.string().trim().min(1, "Informe a data."),
  url: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().optional(),
  logoId: z.string().trim().optional().or(z.literal("")),
});

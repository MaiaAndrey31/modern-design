import { z } from "zod";

export const showSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().trim().min(1, "Informe a data."),
  time: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Informe a cidade."),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  venue: z.string().trim().min(1, "Informe o local."),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  ticketUrl: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  soldOut: z.boolean().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  imageId: z.string().trim().optional().or(z.literal("")),
});

export type ShowInput = z.infer<typeof showSchema>;

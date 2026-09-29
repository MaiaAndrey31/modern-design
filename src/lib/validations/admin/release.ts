import { z } from "zod";

export const releaseSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  yearLabel: z.string().trim().min(4, "Informe o ano."),
  type: z.enum(["SINGLE", "EP", "ALBUM", "REMIX"]),
  spotifyUrl: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  appleMusicUrl: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  youtubeUrl: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  published: z.boolean().optional(),
  coverId: z.string().trim().optional().or(z.literal("")),
});

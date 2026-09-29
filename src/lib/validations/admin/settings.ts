import { z } from "zod";

export const siteIdentitySchema = z.object({
  artistName: z.string().trim().min(1, "Informe o nome artístico."),
  roles: z.string().trim().min(1, "Informe pelo menos uma função."),
  startYear: z.coerce.number().int().min(1900, "Ano inválido.").max(new Date().getFullYear(), "Ano inválido."),
  bioShort: z.string().trim().min(1, "Informe a biografia curta."),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
});

export const socialLinkSchema = z.object({
  platform: z.enum(["INSTAGRAM", "SPOTIFY", "APPLE_MUSIC", "YOUTUBE", "TIKTOK", "WHATSAPP"]),
  label: z.string().trim().min(1),
  url: z.string().trim().url("Link inválido."),
});

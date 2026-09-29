import { z } from "zod";

export const siteIdentitySchema = z.object({
  artistName: z.string().trim().min(1, "Informe o nome artístico."),
  roles: z.string().trim().min(1, "Informe pelo menos uma função."),
  startYear: z.coerce.number().int().min(1900, "Ano inválido.").max(new Date().getFullYear(), "Ano inválido."),
  bioShort: z.string().trim().min(1, "Informe a biografia curta."),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
});

/** Platforms offered by the legacy settings screen (replaced in Phase 4 by the registry-driven editor). */
export const LEGACY_SOCIAL_PLATFORMS = ["INSTAGRAM", "SPOTIFY", "APPLE_MUSIC", "YOUTUBE", "TIKTOK", "WHATSAPP"] as const;
export type LegacySocialPlatform = (typeof LEGACY_SOCIAL_PLATFORMS)[number];
/** Legacy enum value → SOCIAL_PLATFORMS id stored in SocialLink.platform. */
export const legacyPlatformId = (platform: LegacySocialPlatform) => platform.toLowerCase();

export const socialLinkSchema = z.object({
  platform: z.enum(LEGACY_SOCIAL_PLATFORMS),
  label: z.string().trim().min(1),
  url: z.string().trim().url("Link inválido."),
});

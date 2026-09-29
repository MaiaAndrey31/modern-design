import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { isLocale } from "@/lib/i18n/locale";
import { getEnvSiteUrl, normalizeSiteUrl } from "@/lib/siteUrl";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import type { SiteConfigDto } from "./dto";

const query = unstable_cache(
  async (): Promise<SiteConfigDto> => {
    const row = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
    if (!row) return { ...SYSTEM_DEFAULTS.site };
    return {
      siteUrl: row.siteUrl,
      defaultLocale: isLocale(row.defaultLocale) ? row.defaultLocale : SYSTEM_DEFAULTS.site.defaultLocale,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      whatsappNumber: row.whatsappNumber,
    };
  },
  ["content", "site"],
  { tags: [CACHE_TAGS.site, CACHE_TAGS.all], revalidate: 3600 }
);

/** Technical site configuration. Falls back to SYSTEM_DEFAULTS before the seed runs — the site never breaks on it. */
export const getSiteConfig = cache(query);

/** Full resolution chain: SiteSettings.siteUrl → env (see src/lib/siteUrl.ts). */
export async function getSiteUrl(): Promise<string> {
  const config = await getSiteConfig();
  return normalizeSiteUrl(config.siteUrl) ?? getEnvSiteUrl();
}

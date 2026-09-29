import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import { getSiteSettings } from "./site";
import type { SeoDto } from "./dto";

const query = unstable_cache(
  async () => {
    const row = await prisma.seoSettings.findUnique({ where: { id: "singleton" }, include: { ogImage: true } });
    return {
      metaTitle: row?.metaTitle ?? null,
      metaDescription: row?.metaDescription ?? null,
      ogImageUrl: row?.ogImage?.url ?? null,
      twitterHandle: row?.twitterHandle ?? null,
      robotsIndex: row?.robotsIndex ?? true,
    };
  },
  ["content", "seo"],
  { tags: [CACHE_TAGS.seo, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedQuery = cache(query);

/** `metaTitle`/`metaDescription` fall back to SiteSettings when unset, so SEO is never blank even before an admin visits the SEO screen. */
export async function getSeoSettings(): Promise<SeoDto> {
  const [seo, site] = await Promise.all([cachedQuery(), getSiteSettings()]);
  return {
    metaTitle: seo.metaTitle ?? `${site.artistName} — The Experience`,
    metaDescription: seo.metaDescription ?? site.bioShort,
    ogImageUrl: seo.ogImageUrl,
    twitterHandle: seo.twitterHandle,
    robotsIndex: seo.robotsIndex,
  };
}

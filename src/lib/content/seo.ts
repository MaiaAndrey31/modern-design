import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedOptional, mapLocalized } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { toMediaRef } from "./mappers";
import { getBrand } from "./brand";
import type { SeoDto } from "./dto";

const query = unstable_cache(
  async () => {
    const row = await prisma.seoSettings.findUnique({ where: { id: SINGLETON_ID }, include: { ogImage: true } });
    return {
      metaTitle: row ? localizedOptional(row.metaTitlePt, row.metaTitleEn) : null,
      metaDescription: row ? localizedOptional(row.metaDescriptionPt, row.metaDescriptionEn) : null,
      ogImage: toMediaRef(row?.ogImage),
      twitterHandle: row?.twitterHandle ?? null,
      robotsIndex: row?.robotsIndex ?? true,
    };
  },
  ["content", "seo"],
  { tags: [CACHE_TAGS.seo, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedQuery = cache(query);

/** Title/description always resolve (SeoSettings → brand), so metadata is never blank. */
export async function getSeo(): Promise<SeoDto> {
  const [seo, brand] = await Promise.all([cachedQuery(), getBrand()]);
  return {
    metaTitle: seo.metaTitle ?? mapLocalized(brand.tagline, (tagline) => `${brand.brandName} — ${tagline}`),
    metaDescription: seo.metaDescription ?? brand.description,
    ogImage: seo.ogImage,
    twitterHandle: seo.twitterHandle,
    robotsIndex: seo.robotsIndex,
  };
}

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toMediaRef } from "./mappers";
import type { BrandDto } from "./dto";

const d = SYSTEM_DEFAULTS.brand;

const FALLBACK: BrandDto = {
  brandName: d.brandName,
  shortName: d.shortName,
  monogram: d.monogram,
  tagline: localized(d.taglinePt, d.taglineEn),
  description: localized(d.descriptionPt, d.descriptionEn),
  logos: { primary: null, secondary: null, light: null, dark: null },
  icon: null,
  favicon: null,
  updatedAt: null,
};

const query = unstable_cache(
  async (): Promise<BrandDto> => {
    const row = await prisma.brandSettings.findUnique({
      where: { id: SINGLETON_ID },
      include: { primaryLogo: true, secondaryLogo: true, lightLogo: true, darkLogo: true, icon: true, favicon: true },
    });
    if (!row) return FALLBACK;
    return {
      brandName: row.brandName || d.brandName,
      shortName: row.shortName || row.brandName || d.shortName,
      monogram: row.monogram || d.monogram,
      tagline: localized(row.taglinePt, row.taglineEn),
      description: localized(row.descriptionPt, row.descriptionEn),
      logos: {
        primary: toMediaRef(row.primaryLogo),
        secondary: toMediaRef(row.secondaryLogo),
        light: toMediaRef(row.lightLogo),
        dark: toMediaRef(row.darkLogo),
      },
      icon: toMediaRef(row.icon),
      favicon: toMediaRef(row.favicon),
      updatedAt: row.updatedAt.toISOString(),
    };
  },
  ["content", "brand"],
  { tags: [CACHE_TAGS.brand, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Universal brand identity (name, tagline, logos, favicon). */
export const getBrand = cache(query);

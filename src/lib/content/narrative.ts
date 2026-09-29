import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedList, localizedOptional } from "@/lib/i18n/locale";
import { STORY_LIMITS } from "@/lib/story/registry";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toMediaRef } from "./mappers";
import { getBrand } from "./brand";
import type { NarrativeDto } from "./dto";

const { min, max } = STORY_LIMITS.narrativeVhPerLine;

const query = unstable_cache(
  async () => {
    const row = await prisma.narrativeSection.findUnique({
      where: { id: SINGLETON_ID },
      include: { backgroundImage: true },
    });
    const r = row ?? { ...SYSTEM_DEFAULTS.narrative, backgroundImage: null };
    return {
      lines: localizedList(r.linesPt, r.linesEn),
      finalWord: localizedOptional(r.finalWordPt, r.finalWordEn),
      vhPerLine: Math.min(max, Math.max(min, r.vhPerLine)),
      backgroundImage: toMediaRef(r.backgroundImage),
    };
  },
  ["content", "narrative"],
  { tags: [CACHE_TAGS.narrative, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedQuery = cache(query);

/** `finalWord` falls back to the brand name. No lines → the section renders nothing. */
export async function getNarrative(): Promise<NarrativeDto> {
  const [narrative, brand] = await Promise.all([cachedQuery(), getBrand()]);
  return {
    ...narrative,
    finalWord: narrative.finalWord ?? { pt: brand.brandName, en: brand.brandName },
  };
}

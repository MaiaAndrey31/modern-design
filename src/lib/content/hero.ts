import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedList, localizedOptional } from "@/lib/i18n/locale";
import { parseYouTubeId } from "@/lib/youtube";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toLink, toMediaRef } from "./mappers";
import { getBrand } from "./brand";
import type { HeroDto } from "./dto";

const d = SYSTEM_DEFAULTS.hero;

const query = unstable_cache(
  async () => {
    const row = await prisma.heroSection.findUnique({
      where: { id: SINGLETON_ID },
      include: { backgroundImage: true, video: true, posterImage: true },
    });
    const r = row ?? { ...d, backgroundImage: null, video: null, posterImage: null };
    return {
      headlineLines: localizedList(r.headlineLinesPt, r.headlineLinesEn),
      backgroundImage: toMediaRef(r.backgroundImage),
      video: toMediaRef(r.video),
      youtubeId: r.youtubeUrl ? parseYouTubeId(r.youtubeUrl) : null,
      posterImage: toMediaRef(r.posterImage),
      enableWebgl: r.enableWebgl,
      foundedLabel: localizedOptional(r.foundedLabelPt, r.foundedLabelEn),
      primaryCta: toLink(r.primaryCtaType, r.primaryCtaTarget, r.primaryCtaLabelPt, r.primaryCtaLabelEn),
      secondaryCta: toLink(r.secondaryCtaType, r.secondaryCtaTarget, r.secondaryCtaLabelPt, r.secondaryCtaLabelEn),
    };
  },
  ["content", "hero"],
  { tags: [CACHE_TAGS.hero, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedQuery = cache(query);

/** Headline falls back to the brand name — the Hero is never empty. */
export async function getHero(): Promise<HeroDto> {
  const [hero, brand] = await Promise.all([cachedQuery(), getBrand()]);
  const fallback = [brand.brandName];
  return {
    ...hero,
    headlineLines: {
      pt: hero.headlineLines.pt.length > 0 ? hero.headlineLines.pt : fallback,
      en: hero.headlineLines.en.length > 0 ? hero.headlineLines.en : fallback,
    },
  };
}

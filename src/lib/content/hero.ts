import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { HeroDto } from "./dto";
import { parseYouTubeId } from "@/lib/youtube";

const FALLBACK: HeroDto = {
  headlineLines: ["Alan", "Saher"],
  eyebrow: null,
  backgroundUrl: null,
  videoUrl: null,
  youtubeId: null,
  posterUrl: null,
  enableWebgl: true,
  primaryCtaLabel: "Explore",
  primaryCtaTarget: "story",
  secondaryCtaLabel: "Booking",
  secondaryCtaTarget: "booking",
};

const query = unstable_cache(
  async (): Promise<HeroDto> => {
    const row = await prisma.hero.findUnique({
      where: { id: "singleton" },
      include: { backgroundImage: true, video: true, posterImage: true },
    });
    if (!row) return FALLBACK;
    return {
      headlineLines: row.headlineLines.length > 0 ? row.headlineLines : FALLBACK.headlineLines,
      eyebrow: row.eyebrowOverride,
      backgroundUrl: row.backgroundImage?.url ?? null,
      videoUrl: row.video?.url ?? null,
      youtubeId: row.youtubeUrl ? parseYouTubeId(row.youtubeUrl) : null,
      posterUrl: row.posterImage?.url ?? null,
      enableWebgl: row.enableWebgl,
      primaryCtaLabel: row.primaryCtaLabel,
      primaryCtaTarget: row.primaryCtaTarget,
      secondaryCtaLabel: row.secondaryCtaLabel,
      secondaryCtaTarget: row.secondaryCtaTarget,
    };
  },
  ["content", "hero"],
  { tags: [CACHE_TAGS.hero, CACHE_TAGS.all], revalidate: 3600 }
);

export const getHero = cache(query);

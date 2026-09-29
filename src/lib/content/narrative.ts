import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import { getSiteSettings } from "./site";
import type { NarrativeDto } from "./dto";

const FALLBACK_LINES = [
  "The stage changes.",
  "The crowd changes.",
  "The country changes.",
  "The energy doesn't.",
];

const query = unstable_cache(
  async (): Promise<Omit<NarrativeDto, "finalWord"> & { finalWordOverride: string | null }> => {
    const row = await prisma.narrativeSection.findUnique({
      where: { id: "singleton" },
      include: { backgroundImage: true },
    });
    if (!row || !row.isVisible) {
      return { lines: [], backgroundUrl: null, vhPerLine: 95, finalWordOverride: null };
    }
    return {
      lines: row.lines.length > 0 ? row.lines : FALLBACK_LINES,
      backgroundUrl: row.backgroundImage?.url ?? null,
      vhPerLine: row.vhPerLine,
      finalWordOverride: row.finalWordOverride,
    };
  },
  ["content", "narrative"],
  { tags: [CACHE_TAGS.narrative, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedQuery = cache(query);

/** Resolves `finalWord` against SiteSettings.artistName when no override is set. */
export async function getNarrative(): Promise<NarrativeDto> {
  const [narrative, site] = await Promise.all([cachedQuery(), getSiteSettings()]);
  return {
    lines: narrative.lines,
    backgroundUrl: narrative.backgroundUrl,
    vhPerLine: narrative.vhPerLine,
    finalWord: narrative.finalWordOverride ?? site.artistName,
  };
}

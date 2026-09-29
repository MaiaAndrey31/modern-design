import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { toMediaRef } from "./mappers";
import type { StageDto } from "./dto";

const query = unstable_cache(
  async (): Promise<StageDto[]> => {
    const rows = await prisma.worldStage.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      take: 8, // each stage is a near-full-viewport panel — see README
      include: { image: true, video: true },
    });
    return rows.map((row) => ({
      id: row.id,
      year: row.yearLabel,
      title: localized(row.titlePt, row.titleEn),
      location: localized(row.locationPt, row.locationEn),
      description: localized(row.descriptionPt, row.descriptionEn),
      image: toMediaRef(row.image),
      video: toMediaRef(row.video),
      showInNumbers: row.showInNumbers,
    }));
  },
  ["content", "world-stages"],
  { tags: [CACHE_TAGS.stages, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Feeds both the World Stages section and (filtered by `showInNumbers`) the Numbers section. */
export const getWorldStages = cache(query);

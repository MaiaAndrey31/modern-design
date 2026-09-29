import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
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
      title: row.title,
      location: row.location,
      description: row.description,
      imageUrl: row.image?.url ?? null,
      videoUrl: row.video?.url ?? null,
      showInNumbers: row.showInNumbers,
    }));
  },
  ["content", "world-stages"],
  { tags: [CACHE_TAGS.stages, CACHE_TAGS.all], revalidate: 3600 }
);

/** Feeds both the World Stages section and (filtered by `showInNumbers`) the Numbers section. */
export const getWorldStages = cache(query);

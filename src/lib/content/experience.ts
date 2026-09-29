import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { toMediaRef } from "./mappers";
import type { ExperienceFrameDto } from "./dto";

const query = unstable_cache(
  async (): Promise<ExperienceFrameDto[]> => {
    const rows = await prisma.experienceFrame.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { slot: "asc" },
      include: { media: true },
    });
    return rows.map((row) => ({
      slot: row.slot,
      layout: row.layout,
      offsetPx: row.offsetPx,
      media: toMediaRef(row.media),
      alt: localized(row.altPt, row.altEn),
    }));
  },
  ["content", "experience"],
  { tags: [CACHE_TAGS.experience, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Published frames of the fixed 4-slot grid. Heading comes from Section("experience"). */
export const getExperienceFrames = cache(query);

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { ExperienceDto, FrameDto } from "./dto";

const query = unstable_cache(
  async (): Promise<ExperienceDto> => {
    const [section, frameRows] = await Promise.all([
      prisma.experienceSection.findUnique({ where: { id: "singleton" } }),
      prisma.experienceFrame.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { slot: "asc" },
        include: { media: true },
      }),
    ]);

    const frames: FrameDto[] = frameRows.map((row) => ({
      slot: row.slot,
      layout: row.layout,
      offsetPx: row.offsetPx,
      mediaUrl: row.media?.url ?? null,
      alt: row.alt,
    }));

    return {
      eyebrow: section?.eyebrow ?? "The Experience",
      heading: section?.heading ?? "Lights, crowd, energy.",
      frames,
    };
  },
  ["content", "experience"],
  { tags: [CACHE_TAGS.experience, CACHE_TAGS.all], revalidate: 3600 }
);

export const getExperience = cache(query);

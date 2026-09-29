import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { StoryDto } from "./dto";

const query = unstable_cache(
  async (): Promise<StoryDto> => {
    const [contentRow, milestoneRows] = await Promise.all([
      prisma.storyContent.findUnique({ where: { id: "singleton" } }),
      prisma.timelineEvent.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        take: 14, // Story's pinned horizontal scroll gets unwieldy well beyond this — see README
        include: { image: true },
      }),
    ]);

    return {
      content: {
        eyebrow: contentRow?.eyebrow ?? "The Story",
        headingLine1: contentRow?.headingLine1 ?? "30+ years,",
        headingLine2: contentRow?.headingLine2 ?? "one journey.",
      },
      milestones: milestoneRows.map((row) => ({
        id: row.id,
        year: row.yearLabel,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        image: row.image?.url ?? null,
      })),
    };
  },
  ["content", "story"],
  { tags: [CACHE_TAGS.story, CACHE_TAGS.all], revalidate: 3600 }
);

export const getStory = cache(query);

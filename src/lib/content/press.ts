import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import { getSiteSettings } from "./site";
import type { PressDto, PressKitDto } from "./dto";

const pressQuery = unstable_cache(
  async (): Promise<PressDto[]> => {
    const rows = await prisma.pressItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      outlet: row.outlet,
      title: row.title,
      date: row.dateLabel,
      url: row.url,
      excerpt: row.excerpt,
    }));
  },
  ["content", "press"],
  { tags: [CACHE_TAGS.press, CACHE_TAGS.all], revalidate: 3600 }
);

/** Empty by design until real press coverage exists — Press.tsx renders an appropriate empty state. */
export const getPress = cache(pressQuery);

const pressKitQuery = unstable_cache(
  async () => {
    const row = await prisma.pressKit.findUnique({ where: { id: "singleton" } });
    return {
      eyebrow: row?.eyebrow ?? "Press Kit",
      heading: row?.heading ?? "For promoters & media.",
      bioOverride: row?.bioOverride ?? null,
      downloadsNote: row?.downloadsNote ?? "Downloadable one-sheet, photos and logos — coming soon",
    };
  },
  ["content", "presskit"],
  { tags: [CACHE_TAGS.presskit, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedPressKitQuery = cache(pressKitQuery);

export async function getPressKit(): Promise<PressKitDto> {
  const [pressKit, site] = await Promise.all([cachedPressKitQuery(), getSiteSettings()]);
  return {
    eyebrow: pressKit.eyebrow,
    heading: pressKit.heading,
    bio: pressKit.bioOverride ?? site.bioFull,
    downloadsNote: pressKit.downloadsNote,
  };
}

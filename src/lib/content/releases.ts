import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { ReleaseDto } from "./dto";

const TYPE_MAP = { SINGLE: "single", EP: "ep", ALBUM: "album", REMIX: "remix" } as const;

const query = unstable_cache(
  async (): Promise<ReleaseDto[]> => {
    const rows = await prisma.release.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { cover: true },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      year: row.yearLabel,
      cover: row.cover?.url ?? null,
      spotifyUrl: row.spotifyUrl,
      appleMusicUrl: row.appleMusicUrl,
      youtubeUrl: row.youtubeUrl,
      type: TYPE_MAP[row.type],
    }));
  },
  ["content", "releases"],
  { tags: [CACHE_TAGS.releases, CACHE_TAGS.all], revalidate: 3600 }
);

/** Empty by design when no releases are published yet — Music.tsx renders a "connect on streaming" state instead. */
export const getReleases = cache(query);

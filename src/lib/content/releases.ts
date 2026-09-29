import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import { RELEASE_TYPE_MAP, toMediaRef } from "./mappers";
import type { ReleaseDto } from "./dto";

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
      type: RELEASE_TYPE_MAP[row.type],
      cover: toMediaRef(row.cover),
      spotifyUrl: row.spotifyUrl,
      appleMusicUrl: row.appleMusicUrl,
      youtubeUrl: row.youtubeUrl,
      soundcloudUrl: row.soundcloudUrl,
    }));
  },
  ["content", "releases"],
  { tags: [CACHE_TAGS.releases, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Empty by design when no releases are published — Music renders its empty state instead. */
export const getReleases = cache(query);

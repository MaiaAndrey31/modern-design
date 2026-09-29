import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { GalleryDto } from "./dto";

const ORIENTATION_MAP = { PORTRAIT: "portrait", LANDSCAPE: "landscape", SQUARE: "square" } as const;

const query = unstable_cache(
  async (): Promise<GalleryDto[]> => {
    const rows = await prisma.galleryItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
    return rows.map((row) => ({
      id: row.id,
      src: row.media.url,
      alt: row.alt,
      caption: row.caption,
      orientation: ORIENTATION_MAP[row.orientation],
      // Real dimensions (captured from the file at upload time) — never a
      // guessed ratio, so next/image never causes layout shift here.
      width: row.media.width ?? 1200,
      height: row.media.height ?? 1200,
    }));
  },
  ["content", "gallery"],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.all], revalidate: 3600 }
);

export const getGallery = cache(query);

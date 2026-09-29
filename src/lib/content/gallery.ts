import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized, localizedOptional } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { ORIENTATION_MAP, toMediaRef } from "./mappers";
import type { GalleryItemDto } from "./dto";

const query = unstable_cache(
  async (): Promise<GalleryItemDto[]> => {
    const rows = await prisma.galleryItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
    return rows.flatMap((row) => {
      const image = toMediaRef(row.media);
      if (!image) return [];
      return [
        {
          id: row.id,
          image,
          // Real dimensions (captured at upload time) — never a guessed ratio, so next/image never shifts layout.
          width: row.media.width ?? 1200,
          height: row.media.height ?? 1200,
          alt: localized(row.altPt, row.altEn),
          caption: localizedOptional(row.captionPt, row.captionEn),
          orientation: ORIENTATION_MAP[row.orientation],
        },
      ];
    });
  },
  ["content", "gallery"],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Empty → the Gallery section renders nothing. */
export const getGallery = cache(query);

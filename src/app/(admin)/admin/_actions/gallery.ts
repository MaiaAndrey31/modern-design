"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";

function orientationFromDimensions(width: number, height: number): "PORTRAIT" | "LANDSCAPE" | "SQUARE" {
  const ratio = width / height;
  if (ratio > 1.05) return "LANDSCAPE";
  if (ratio < 0.95) return "PORTRAIT";
  return "SQUARE";
}

export async function addGalleryItem(mediaId: string, alt: string) {
  await requireRole(["ADMIN", "EDITOR"]);

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error("Mídia não encontrada.");

  const maxOrder = await prisma.galleryItem.aggregate({ _max: { sortOrder: true } });

  const item = await prisma.galleryItem.create({
    data: {
      mediaId,
      alt,
      orientation: orientationFromDimensions(media.width ?? 1200, media.height ?? 1200),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      status: "PUBLISHED",
    },
  });

  updateTag(CACHE_TAGS.gallery);
  revalidatePath("/");
  return { id: item.id };
}

export async function updateGalleryItem(id: string, data: { alt?: string; caption?: string; status?: "DRAFT" | "PUBLISHED" }) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.galleryItem.update({ where: { id }, data });
  updateTag(CACHE_TAGS.gallery);
  revalidatePath("/");
}

export async function deleteGalleryItem(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.galleryItem.delete({ where: { id } });
  updateTag(CACHE_TAGS.gallery);
  revalidatePath("/");
}

export async function reorderGalleryItems(orderedIds: string[]) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.$transaction(orderedIds.map((id, index) => prisma.galleryItem.update({ where: { id }, data: { sortOrder: index } })));
  updateTag(CACHE_TAGS.gallery);
  revalidatePath("/");
}

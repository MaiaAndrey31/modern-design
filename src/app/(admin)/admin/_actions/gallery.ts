"use server";

import { prisma } from "@/lib/db";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { galleryItemSchema } from "@/lib/validations/cms/collections";
import { entityId } from "@/lib/validations/cms/common";
import { reorderSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

function orientationFromDimensions(width: number, height: number): "PORTRAIT" | "LANDSCAPE" | "SQUARE" {
  const ratio = width / height;
  if (ratio > 1.05) return "LANDSCAPE";
  if (ratio < 0.95) return "PORTRAIT";
  return "SQUARE";
}

const editSchema = galleryItemSchema.pick({ altPt: true, altEn: true, captionPt: true, captionEn: true, status: true });

export async function addGalleryItem(mediaId: string, alt: string): Promise<ActionState & { id?: string }> {
  const user = await requireRole(CONTENT_ROLES);
  const parsedId = entityId.safeParse(mediaId);
  if (!parsedId.success) return failed("Mídia inválida.");
  const media = await prisma.media.findUnique({ where: { id: parsedId.data } });
  if (!media || media.kind !== "IMAGE") return failed("Escolha uma imagem válida.");

  const altPt = alt.trim().slice(0, 200) || media.alt || "Foto";
  const maxOrder = await prisma.galleryItem.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.galleryItem.create({
    data: {
      mediaId: media.id,
      altPt,
      orientation: orientationFromDimensions(media.width ?? 1200, media.height ?? 1200),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      status: "PUBLISHED",
    },
  });

  await audit({ userId: user.id, action: "create", entity: "GalleryItem", entityId: item.id, summary: `Foto adicionada: ${altPt}` });
  invalidate(CACHE_TAGS.gallery);
  return { ok: true, id: item.id };
}

export async function updateGalleryItem(
  id: string,
  input: { altPt: string; altEn: string; captionPt: string; captionEn: string; status: "DRAFT" | "PUBLISHED" }
): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await prisma.galleryItem.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!row) return failed("Foto não encontrada.");

  await audit({ userId: user.id, action: "update", entity: "GalleryItem", entityId: id, summary: `Foto: ${parsed.data.altPt}`, diff: parsed.data });
  invalidate(CACHE_TAGS.gallery);
  return saved();
}

export async function deleteGalleryItem(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.galleryItem.findUnique({ where: { id }, select: { altPt: true } });
  if (!row) return saved();
  // Removes the gallery entry only — the file stays in the media library.
  await prisma.galleryItem.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "GalleryItem", entityId: id, summary: `Foto removida da galeria: ${row.altPt}` });
  invalidate(CACHE_TAGS.gallery);
  return saved();
}

export async function reorderGalleryItems(orderedIds: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(orderedIds);
  if (!parsed.success) return failed("Ordem inválida.");
  const matching = await prisma.galleryItem.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== (await prisma.galleryItem.count())) return failed("A galeria mudou em outra aba — recarregue a página.");

  await prisma.$transaction(parsed.data.map((id, index) => prisma.galleryItem.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "GalleryItem", summary: "Ordem da galeria", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.gallery);
  return saved();
}

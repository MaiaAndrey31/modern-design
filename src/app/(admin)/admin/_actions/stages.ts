"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { findInvalidMedia } from "@/lib/admin/media";
import { bool, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { worldStageSchema } from "@/lib/validations/cms/collections";
import { reorderSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

async function saveWorldStage(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.worldStage.findUnique({ where: { id }, select: { sortOrder: true } }) : null;
  if (id && !existing) return failed("Palco não encontrado.");

  const parsed = worldStageSchema.safeParse({
    yearLabel: text(formData, "yearLabel"),
    titlePt: text(formData, "titlePt"),
    titleEn: text(formData, "titleEn"),
    locationPt: text(formData, "locationPt"),
    locationEn: text(formData, "locationEn"),
    descriptionPt: text(formData, "descriptionPt"),
    descriptionEn: text(formData, "descriptionEn"),
    imageId: text(formData, "imageId"),
    videoId: text(formData, "videoId"),
    showInNumbers: bool(formData, "showInNumbers"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return invalid(parsed.error);
  const bad = await findInvalidMedia({
    imageId: { id: parsed.data.imageId, kind: "IMAGE" },
    videoId: { id: parsed.data.videoId, kind: "VIDEO" },
  });
  if (bad) return { ok: false, error: "Escolha um arquivo do tipo correto.", fieldErrors: { [bad]: ["Mídia inválida."] } };

  const sortOrder = existing?.sortOrder ?? ((await prisma.worldStage.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const data = { ...parsed.data, sortOrder };
  const row = id ? await prisma.worldStage.update({ where: { id }, data }) : await prisma.worldStage.create({ data });

  await audit({ userId: user.id, action: id ? "update" : "create", entity: "WorldStage", entityId: row.id, summary: `Palco: ${row.titlePt}`, diff: data });
  invalidate(CACHE_TAGS.stages);
  redirect("/admin/world-stages");
}

export async function createWorldStageAction(_prev: ActionState, formData: FormData) {
  return saveWorldStage(null, formData);
}

export async function updateWorldStageAction(id: string, _prev: ActionState, formData: FormData) {
  return saveWorldStage(id, formData);
}

export async function deleteWorldStageAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.worldStage.findUnique({ where: { id }, select: { titlePt: true } });
  if (!row) return saved();
  await prisma.worldStage.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "WorldStage", entityId: id, summary: `Palco excluído: ${row.titlePt}` });
  invalidate(CACHE_TAGS.stages);
  return saved();
}

export async function reorderWorldStagesAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const matching = await prisma.worldStage.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== (await prisma.worldStage.count())) return failed("A lista mudou em outra aba — recarregue a página.");

  await prisma.$transaction(parsed.data.map((id, index) => prisma.worldStage.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "WorldStage", summary: "Ordem dos palcos", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.stages);
  return saved();
}

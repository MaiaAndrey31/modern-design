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
import { releaseSchema } from "@/lib/validations/cms/collections";
import { reorderSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

async function saveRelease(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.release.findUnique({ where: { id }, select: { sortOrder: true } }) : null;
  if (id && !existing) return failed("Lançamento não encontrado.");

  const parsed = releaseSchema.safeParse({
    title: text(formData, "title"),
    yearLabel: text(formData, "yearLabel"),
    type: text(formData, "type"),
    coverId: text(formData, "coverId"),
    spotifyUrl: text(formData, "spotifyUrl"),
    appleMusicUrl: text(formData, "appleMusicUrl"),
    youtubeUrl: text(formData, "youtubeUrl"),
    soundcloudUrl: text(formData, "soundcloudUrl"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return invalid(parsed.error);
  if (await findInvalidMedia({ coverId: { id: parsed.data.coverId, kind: "IMAGE" } })) {
    return { ok: false, error: "Escolha uma imagem válida para a capa.", fieldErrors: { coverId: ["Imagem inválida."] } };
  }

  const sortOrder = existing?.sortOrder ?? ((await prisma.release.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const data = { ...parsed.data, sortOrder };
  const row = id ? await prisma.release.update({ where: { id }, data }) : await prisma.release.create({ data });

  await audit({ userId: user.id, action: id ? "update" : "create", entity: "Release", entityId: row.id, summary: `Lançamento: ${row.title}`, diff: data });
  invalidate(CACHE_TAGS.releases);
  redirect("/admin/releases");
}

export async function createReleaseAction(_prev: ActionState, formData: FormData) {
  return saveRelease(null, formData);
}

export async function updateReleaseAction(id: string, _prev: ActionState, formData: FormData) {
  return saveRelease(id, formData);
}

export async function deleteReleaseAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.release.findUnique({ where: { id }, select: { title: true } });
  if (!row) return saved();
  await prisma.release.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "Release", entityId: id, summary: `Lançamento excluído: ${row.title}` });
  invalidate(CACHE_TAGS.releases);
  return saved();
}

export async function reorderReleasesAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const matching = await prisma.release.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== (await prisma.release.count())) return failed("A lista mudou em outra aba — recarregue a página.");
  await prisma.$transaction(parsed.data.map((id, index) => prisma.release.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "Release", summary: "Ordem dos lançamentos", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.releases);
  return saved();
}

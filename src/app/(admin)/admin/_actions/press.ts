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
import { pressItemSchema } from "@/lib/validations/cms/collections";
import { reorderSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

async function savePressItem(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.pressItem.findUnique({ where: { id }, select: { sortOrder: true } }) : null;
  if (id && !existing) return failed("Matéria não encontrada.");

  const parsed = pressItemSchema.safeParse({
    outlet: text(formData, "outlet"),
    title: text(formData, "title"),
    dateLabel: text(formData, "dateLabel"),
    publishedAt: text(formData, "publishedAt"),
    url: text(formData, "url"),
    excerptPt: text(formData, "excerptPt"),
    excerptEn: text(formData, "excerptEn"),
    logoId: text(formData, "logoId"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return invalid(parsed.error);
  if (await findInvalidMedia({ logoId: { id: parsed.data.logoId, kind: "IMAGE" } })) {
    return { ok: false, error: "Escolha uma imagem válida para o logo.", fieldErrors: { logoId: ["Imagem inválida."] } };
  }

  const sortOrder = existing?.sortOrder ?? ((await prisma.pressItem.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const { publishedAt, ...rest } = parsed.data;
  const data = { ...rest, publishedAt: publishedAt ? new Date(`${publishedAt}T00:00:00Z`) : null, sortOrder };
  const row = id ? await prisma.pressItem.update({ where: { id }, data }) : await prisma.pressItem.create({ data });

  await audit({ userId: user.id, action: id ? "update" : "create", entity: "PressItem", entityId: row.id, summary: `Matéria: ${row.outlet} — ${row.title}`, diff: { ...parsed.data, sortOrder } });
  invalidate(CACHE_TAGS.press);
  redirect("/admin/press");
}

export async function createPressItemAction(_prev: ActionState, formData: FormData) {
  return savePressItem(null, formData);
}

export async function updatePressItemAction(id: string, _prev: ActionState, formData: FormData) {
  return savePressItem(id, formData);
}

export async function deletePressItemAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.pressItem.findUnique({ where: { id }, select: { title: true } });
  if (!row) return saved();
  await prisma.pressItem.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "PressItem", entityId: id, summary: `Matéria excluída: ${row.title}` });
  invalidate(CACHE_TAGS.press);
  return saved();
}

export async function reorderPressItemsAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const matching = await prisma.pressItem.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== (await prisma.pressItem.count())) return failed("A lista mudou em outra aba — recarregue a página.");
  await prisma.$transaction(parsed.data.map((id, index) => prisma.pressItem.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "PressItem", summary: "Ordem da imprensa", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.press);
  return saved();
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { bool, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { reorderSchema, socialLinkSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

async function saveSocialLink(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.socialLink.findUnique({ where: { id } }) : null;
  if (id && !existing) return failed("Rede não encontrada.");

  const parsed = socialLinkSchema.safeParse({
    platform: text(formData, "platform"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    enabled: bool(formData, "enabled"),
    showInHeader: bool(formData, "showInHeader"),
    showInFooter: bool(formData, "showInFooter"),
    showInMusic: bool(formData, "showInMusic"),
    sortOrder: existing?.sortOrder ?? 0,
  });
  if (!parsed.success) return invalid(parsed.error);

  const sortOrder = existing
    ? existing.sortOrder
    : ((await prisma.socialLink.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const data = { ...parsed.data, sortOrder };

  const row = existing
    ? await prisma.socialLink.update({ where: { id: existing.id }, data })
    : await prisma.socialLink.create({ data });

  await audit({ userId: user.id, action: existing ? "update" : "create", entity: "SocialLink", entityId: row.id, summary: `${row.label} (${row.platform})`, diff: data });
  invalidate(CACHE_TAGS.social);
  redirect("/admin/social");
}

export async function createSocialLinkAction(_prev: ActionState, formData: FormData) {
  return saveSocialLink(null, formData);
}

export async function updateSocialLinkAction(id: string, _prev: ActionState, formData: FormData) {
  return saveSocialLink(id, formData);
}

export async function deleteSocialLinkAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.socialLink.findUnique({ where: { id } });
  if (!row) return saved();
  await prisma.socialLink.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "SocialLink", entityId: id, summary: `${row.label} removida` });
  invalidate(CACHE_TAGS.social);
  return saved();
}

export async function reorderSocialLinksAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const count = await prisma.socialLink.count({ where: { id: { in: parsed.data } } });
  if (count !== parsed.data.length || count !== (await prisma.socialLink.count())) return failed("A lista mudou em outra aba — recarregue a página.");

  await prisma.$transaction(parsed.data.map((id, index) => prisma.socialLink.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "SocialLink", summary: "Ordem das redes sociais", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.social);
  return saved();
}

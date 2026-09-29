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
import { showSchema } from "@/lib/validations/cms/collections";
import type { ActionState } from "@/lib/validations/admin/actionState";

async function saveShow(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  if (id && !(await prisma.show.findUnique({ where: { id }, select: { id: true } }))) return failed("Show não encontrado.");

  const parsed = showSchema.safeParse({
    title: text(formData, "title"),
    date: text(formData, "date"),
    time: text(formData, "time"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    country: text(formData, "country"),
    venue: text(formData, "venue"),
    address: text(formData, "address"),
    ticketUrl: text(formData, "ticketUrl"),
    soldOut: bool(formData, "soldOut"),
    featured: bool(formData, "featured"),
    showStatus: text(formData, "showStatus") || "SCHEDULED",
    imageId: text(formData, "imageId"),
    internalNotes: text(formData, "internalNotes"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return invalid(parsed.error);
  if (await findInvalidMedia({ imageId: { id: parsed.data.imageId, kind: "IMAGE" } })) {
    return { ok: false, error: "Escolha uma imagem válida.", fieldErrors: { imageId: ["Imagem inválida."] } };
  }

  const data = { ...parsed.data, date: new Date(`${parsed.data.date}T00:00:00Z`) };
  const row = id ? await prisma.show.update({ where: { id }, data }) : await prisma.show.create({ data });

  // internalNotes are admin-only — not copied into the audit trail.
  const { internalNotes: _notes, ...auditable } = parsed.data;
  void _notes;
  await audit({ userId: user.id, action: id ? "update" : "create", entity: "Show", entityId: row.id, summary: `Show: ${row.city} — ${parsed.data.date}`, diff: auditable });
  invalidate(CACHE_TAGS.shows);
  redirect("/admin/shows");
}

export async function createShowAction(_prev: ActionState, formData: FormData) {
  return saveShow(null, formData);
}

export async function updateShowAction(id: string, _prev: ActionState, formData: FormData) {
  return saveShow(id, formData);
}

export async function deleteShowAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.show.findUnique({ where: { id }, select: { city: true } });
  if (!row) return saved();
  await prisma.show.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "Show", entityId: id, summary: `Show excluído: ${row.city}` });
  invalidate(CACHE_TAGS.shows);
  return saved();
}

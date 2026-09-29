"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SETTINGS_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { bool, link, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { footerSettingsSchema, headerSettingsSchema, navigationItemSchema, reorderSchema } from "@/lib/validations/cms/settings";
import { NAVIGATION_LOCATIONS, type NavigationLocationId } from "@/lib/navigation/registry";
import type { ActionState } from "@/lib/validations/admin/actionState";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export async function updateHeaderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const parsed = headerSettingsSchema.safeParse({
    logoVariant: text(formData, "logoVariant"),
    showLanguageSwitch: bool(formData, "showLanguageSwitch"),
    showSocials: bool(formData, "showSocials"),
    showCta: bool(formData, "showCta"),
    cta: link(formData, "cta"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { cta, ...flags } = parsed.data;

  const data = {
    ...flags,
    ctaLabelPt: cta.labelPt ?? "",
    ctaLabelEn: cta.labelEn,
    ctaType: cta.type ?? "SECTION",
    ctaTarget: cta.target ?? "",
  };
  await prisma.headerSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...data }, update: data });

  await audit({ userId: user.id, action: "update", entity: "HeaderSettings", entityId: SINGLETON_ID, summary: "Header", diff: data });
  invalidate(CACHE_TAGS.header);
  return saved();
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export async function updateFooterAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const parsed = footerSettingsSchema.safeParse({
    logoVariant: text(formData, "logoVariant"),
    showWordmark: bool(formData, "showWordmark"),
    descriptionPt: text(formData, "descriptionPt"),
    descriptionEn: text(formData, "descriptionEn"),
    copyrightPt: text(formData, "copyrightPt"),
    copyrightEn: text(formData, "copyrightEn"),
    backToTopLabelPt: text(formData, "backToTopLabelPt"),
    backToTopLabelEn: text(formData, "backToTopLabelEn"),
    showBookingCta: bool(formData, "showBookingCta"),
    bookingCta: link(formData, "bookingCta"),
    showSocials: bool(formData, "showSocials"),
    showContact: bool(formData, "showContact"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { bookingCta, ...rest } = parsed.data;

  const data = {
    ...rest,
    bookingLabelPt: bookingCta.labelPt ?? "",
    bookingLabelEn: bookingCta.labelEn,
    bookingType: bookingCta.type ?? "SECTION",
    bookingTarget: bookingCta.target ?? "",
  };
  await prisma.footerSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...data }, update: data });

  await audit({ userId: user.id, action: "update", entity: "FooterSettings", entityId: SINGLETON_ID, summary: "Footer", diff: data });
  invalidate(CACHE_TAGS.footer);
  return saved();
}

// ---------------------------------------------------------------------------
// Menus (NavigationItem)
// ---------------------------------------------------------------------------

async function saveNavigationItem(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const item = link(formData, "item");
  const location = text(formData, "location") as NavigationLocationId;

  const existing = id ? await prisma.navigationItem.findUnique({ where: { id } }) : null;
  if (id && !existing) return failed("Item não encontrado.");

  const parsed = navigationItemSchema.safeParse({
    location,
    enabled: bool(formData, "enabled"),
    openInNewTab: bool(formData, "openInNewTab"),
    sortOrder: existing?.sortOrder ?? 0,
    labelPt: item.labelPt,
    labelEn: item.labelEn,
    type: item.type ?? "",
    target: item.target,
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // Moving to another location appends it there; new items go last.
  const needsNewOrder = !existing || existing.location !== data.location;
  const sortOrder = needsNewOrder
    ? ((await prisma.navigationItem.aggregate({ where: { location: data.location }, _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1
    : existing.sortOrder;

  const payload = {
    location: data.location,
    type: data.type,
    labelPt: data.labelPt,
    labelEn: data.labelEn,
    target: data.target.trim(),
    openInNewTab: data.openInNewTab,
    enabled: data.enabled,
    sortOrder,
  };
  const row = existing
    ? await prisma.navigationItem.update({ where: { id: existing.id }, data: payload })
    : await prisma.navigationItem.create({ data: payload });

  await audit({ userId: user.id, action: existing ? "update" : "create", entity: "NavigationItem", entityId: row.id, summary: `Menu: ${row.labelPt}`, diff: payload });
  invalidate(CACHE_TAGS.navigation);
  redirect("/admin/menus");
}

export async function createNavigationItemAction(_prev: ActionState, formData: FormData) {
  return saveNavigationItem(null, formData);
}

export async function updateNavigationItemAction(id: string, _prev: ActionState, formData: FormData) {
  return saveNavigationItem(id, formData);
}

export async function deleteNavigationItemAction(id: string): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const row = await prisma.navigationItem.findUnique({ where: { id } });
  if (!row) return saved();
  await prisma.navigationItem.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "NavigationItem", entityId: id, summary: `Menu removido: ${row.labelPt}` });
  invalidate(CACHE_TAGS.navigation);
  return saved();
}

export async function setNavigationItemEnabledAction(id: string, enabled: boolean): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const row = await prisma.navigationItem.update({ where: { id }, data: { enabled } }).catch(() => null);
  if (!row) return failed("Item não encontrado.");
  await audit({ userId: user.id, action: "toggle", entity: "NavigationItem", entityId: id, summary: `${row.labelPt} ${enabled ? "ativado" : "desativado"}`, diff: { enabled } });
  invalidate(CACHE_TAGS.navigation);
  return saved();
}

/** New order within ONE location — every id must belong to it (no cross-group writes). */
export async function reorderNavigationItemsAction(location: string, ids: string[]): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  if (!(NAVIGATION_LOCATIONS as readonly string[]).includes(location)) return failed("Grupo de menu inválido.");
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");

  const rows = await prisma.navigationItem.findMany({ where: { location: location as NavigationLocationId }, select: { id: true } });
  const known = new Set(rows.map((r) => r.id));
  if (parsed.data.length !== known.size || !parsed.data.every((id) => known.has(id))) {
    return failed("A lista mudou em outra aba — recarregue a página.");
  }

  await prisma.$transaction(parsed.data.map((id, index) => prisma.navigationItem.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "NavigationItem", summary: `Ordem do menu ${location}`, diff: { location, order: parsed.data } });
  invalidate(CACHE_TAGS.navigation);
  return saved();
}

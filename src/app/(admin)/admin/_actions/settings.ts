"use server";

import { prisma } from "@/lib/db";
import { CONTENT_ROLES, SETTINGS_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { lines, text } from "@/lib/admin/formData";
import { invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { profileSchema, siteSettingsSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

/** Technical site settings (URL, default language, contact) — no identity here. */
export async function updateSiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const parsed = siteSettingsSchema.safeParse({
    siteUrl: text(formData, "siteUrl"),
    defaultLocale: text(formData, "defaultLocale"),
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
    whatsappNumber: text(formData, "whatsappNumber"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await prisma.siteSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });

  await audit({ userId: user.id, action: "update", entity: "SiteSettings", entityId: SINGLETON_ID, summary: "Configurações do site", diff: parsed.data });
  invalidate(CACHE_TAGS.site);
  return saved();
}

/** Template content: roles, bio, origin, founded year. */
export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = profileSchema.safeParse({
    rolesPt: lines(formData, "rolesPt"),
    rolesEn: lines(formData, "rolesEn"),
    bioPt: text(formData, "bioPt"),
    bioEn: text(formData, "bioEn"),
    originLabelPt: text(formData, "originLabelPt"),
    originLabelEn: text(formData, "originLabelEn"),
    foundedYear: text(formData, "foundedYear"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await prisma.profile.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });

  await audit({ userId: user.id, action: "update", entity: "Profile", entityId: SINGLETON_ID, summary: "Perfil", diff: parsed.data });
  // Profile feeds the Hero eyebrow, Numbers, Music sleeve, Press Kit bio and the footer.
  invalidate(CACHE_TAGS.profile, CACHE_TAGS.presskit);
  return saved();
}

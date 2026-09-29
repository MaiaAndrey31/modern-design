"use server";

import { prisma } from "@/lib/db";
import { SETTINGS_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { THEME_COLOR_TOKENS } from "@/lib/theme/registry";
import { closestWeight, resolveFont } from "@/lib/fonts/registry";
import { brandSettingsSchema, themeSettingsSchema, typographySettingsSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

const LOGO_FIELDS = ["primaryLogoId", "secondaryLogoId", "lightLogoId", "darkLogoId", "iconId", "faviconId"] as const;

export async function updateBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);

  const parsed = brandSettingsSchema.safeParse({
    brandName: text(formData, "brandName"),
    shortName: text(formData, "shortName"),
    monogram: text(formData, "monogram"),
    taglinePt: text(formData, "taglinePt"),
    taglineEn: text(formData, "taglineEn"),
    descriptionPt: text(formData, "descriptionPt"),
    descriptionEn: text(formData, "descriptionEn"),
    ...Object.fromEntries(LOGO_FIELDS.map((f) => [f, text(formData, f)])),
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // Branding slots accept images only — a video id can never become a logo/favicon.
  const mediaIds = LOGO_FIELDS.map((f) => data[f]).filter((id): id is string => Boolean(id));
  if (mediaIds.length > 0) {
    const media = await prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, kind: true } });
    const images = new Set(media.filter((m) => m.kind === "IMAGE").map((m) => m.id));
    const bad = LOGO_FIELDS.find((f) => data[f] && !images.has(data[f]!));
    if (bad) return { ok: false, error: "Escolha imagens válidas para logos e favicon.", fieldErrors: { [bad]: ["Imagem inválida."] } };
  }

  await prisma.brandSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });

  await audit({ userId: user.id, action: "update", entity: "BrandSettings", entityId: SINGLETON_ID, summary: `Marca: ${data.brandName}`, diff: data });
  invalidate(CACHE_TAGS.brand, CACHE_TAGS.seo);
  return saved();
}

export async function updateThemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);

  const parsed = themeSettingsSchema.safeParse({
    ...Object.fromEntries(THEME_COLOR_TOKENS.map(({ key }) => [key, text(formData, key)])),
    buttonRadius: text(formData, "buttonRadius"),
    cardRadius: text(formData, "cardRadius"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await prisma.themeSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...parsed.data },
    update: parsed.data,
  });

  await audit({ userId: user.id, action: "update", entity: "ThemeSettings", entityId: SINGLETON_ID, summary: "Cores e raios", diff: parsed.data });
  invalidate(CACHE_TAGS.theme);
  return saved();
}

export async function updateTypographyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);

  const parsed = typographySettingsSchema.safeParse({
    displayFontId: text(formData, "displayFontId"),
    headingFontId: text(formData, "headingFontId"),
    bodyFontId: text(formData, "bodyFontId"),
    displayWeight: text(formData, "displayWeight"),
    headingWeight: text(formData, "headingWeight"),
    bodyWeight: text(formData, "bodyWeight"),
    displayTracking: text(formData, "displayTracking"),
    headingTracking: text(formData, "headingTracking"),
    typeScale: text(formData, "typeScale"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // Each weight must be one the chosen font actually ships (the UI only
  // offers those; this guards against crafted requests).
  for (const role of ["display", "heading", "body"] as const) {
    const font = resolveFont(data[`${role}FontId`], role);
    const weight = data[`${role}Weight`];
    if (closestWeight(font, weight) !== weight) {
      return failed(`${font.label} não oferece o peso ${weight}.`);
    }
  }

  await prisma.typographySettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });

  await audit({
    userId: user.id,
    action: "update",
    entity: "TypographySettings",
    entityId: SINGLETON_ID,
    summary: `Fontes: ${data.displayFontId} / ${data.headingFontId} / ${data.bodyFontId}`,
    diff: data,
  });
  invalidate(CACHE_TAGS.typography);
  return saved();
}

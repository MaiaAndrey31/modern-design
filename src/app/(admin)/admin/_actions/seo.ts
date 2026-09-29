"use server";

import { prisma } from "@/lib/db";
import { SETTINGS_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { bool, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { seoSettingsSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";

export async function updateSeoSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const parsed = seoSettingsSchema.safeParse({
    metaTitlePt: text(formData, "metaTitlePt"),
    metaTitleEn: text(formData, "metaTitleEn"),
    metaDescriptionPt: text(formData, "metaDescriptionPt"),
    metaDescriptionEn: text(formData, "metaDescriptionEn"),
    ogImageId: text(formData, "ogImageId"),
    twitterHandle: text(formData, "twitterHandle"),
    robotsIndex: bool(formData, "robotsIndex"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  if (data.ogImageId) {
    const media = await prisma.media.findUnique({ where: { id: data.ogImageId }, select: { kind: true } });
    if (media?.kind !== "IMAGE") return failed("Escolha uma imagem válida para o compartilhamento.");
  }

  await prisma.seoSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...data }, update: data });

  await audit({ userId: user.id, action: "update", entity: "SeoSettings", entityId: SINGLETON_ID, summary: "SEO", diff: data });
  invalidate(CACHE_TAGS.seo);
  return saved();
}

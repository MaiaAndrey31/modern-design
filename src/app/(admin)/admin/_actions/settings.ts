"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import {
  legacyPlatformId,
  siteIdentitySchema,
  socialLinkSchema,
  type LegacySocialPlatform,
} from "@/lib/validations/admin/settings";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import type { ActionState } from "@/lib/validations/admin/actionState";

export async function updateSiteIdentityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = siteIdentitySchema.safeParse({
    artistName: formData.get("artistName") ?? "",
    roles: formData.get("roles") ?? "",
    startYear: formData.get("startYear") ?? "",
    bioShort: formData.get("bioShort") ?? "",
    whatsappNumber: formData.get("whatsappNumber") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const roles = data.roles.split(",").map((r) => r.trim()).filter(Boolean);

  // TEMPORARY (Phase 3 → 4): the legacy identity form now feeds three models —
  // brand name/description (BrandSettings), roles/founded year (Profile) and
  // WhatsApp (SiteSettings). PT fields only.
  const brand = SYSTEM_DEFAULTS.brand;
  await prisma.$transaction([
    prisma.brandSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { ...brand, id: SINGLETON_ID, brandName: data.artistName, shortName: data.artistName, descriptionPt: data.bioShort },
      update: { brandName: data.artistName, descriptionPt: data.bioShort },
    }),
    prisma.profile.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, rolesPt: roles, foundedYear: data.startYear, bioPt: "" },
      update: { rolesPt: roles, foundedYear: data.startYear },
    }),
    prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, whatsappNumber: data.whatsappNumber || null },
      update: { whatsappNumber: data.whatsappNumber || null },
    }),
  ]);

  updateTag(CACHE_TAGS.brand);
  updateTag(CACHE_TAGS.profile);
  updateTag(CACHE_TAGS.site);
  revalidatePath("/");
  return { ok: true };
}

export async function upsertSocialLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform") ?? "",
    label: formData.get("label") ?? "",
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  // TEMPORARY (Phase 3 → 4): platform is no longer unique — update the first row for it, or create one.
  const platform = legacyPlatformId(data.platform);
  const existing = await prisma.socialLink.findFirst({ where: { platform }, select: { id: true } });
  if (existing) {
    await prisma.socialLink.update({ where: { id: existing.id }, data: { label: data.label, url: data.url, enabled: true } });
  } else {
    await prisma.socialLink.create({ data: { platform, label: data.label, url: data.url, enabled: true } });
  }

  updateTag(CACHE_TAGS.social);
  revalidatePath("/");
  return { ok: true };
}

export async function disableSocialLinkAction(platform: LegacySocialPlatform) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.socialLink.updateMany({
    where: { platform: legacyPlatformId(platform) },
    data: { enabled: false },
  });
  updateTag(CACHE_TAGS.social);
  revalidatePath("/");
}

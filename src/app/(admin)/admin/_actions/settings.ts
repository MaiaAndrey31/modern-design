"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { siteIdentitySchema, socialLinkSchema } from "@/lib/validations/admin/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";
import type { SocialPlatform } from "@/generated/prisma/client";

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

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      artistName: data.artistName,
      roles,
      startYear: data.startYear,
      bioShort: data.bioShort,
      bioFull: data.bioShort,
      whatsappNumber: data.whatsappNumber || null,
      tagline: "30+ Years. One Sound. Thousands of Stories.",
      originStatement: "From Minas to the World.",
    },
    update: {
      artistName: data.artistName,
      roles,
      startYear: data.startYear,
      bioShort: data.bioShort,
      whatsappNumber: data.whatsappNumber || null,
    },
  });

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

  await prisma.socialLink.upsert({
    where: { platform: data.platform },
    create: { platform: data.platform, label: data.label, url: data.url, isConfigured: true, status: "PUBLISHED" },
    update: { label: data.label, url: data.url, isConfigured: true },
  });

  updateTag(CACHE_TAGS.social);
  revalidatePath("/");
  return { ok: true };
}

export async function disableSocialLinkAction(platform: SocialPlatform) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.socialLink.updateMany({
    where: { platform },
    data: { isConfigured: false, url: "#" },
  });
  updateTag(CACHE_TAGS.social);
  revalidatePath("/");
}

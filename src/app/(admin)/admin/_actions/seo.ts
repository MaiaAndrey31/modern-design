"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { seoSettingsSchema } from "@/lib/validations/admin/seo";
import type { ActionState } from "@/lib/validations/admin/actionState";

export async function updateSeoSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = seoSettingsSchema.safeParse({
    metaTitle: formData.get("metaTitle") ?? "",
    metaDescription: formData.get("metaDescription") ?? "",
    twitterHandle: formData.get("twitterHandle") ?? "",
    robotsIndex: formData.get("robotsIndex") === "on",
    ogImageId: formData.get("ogImageId") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const twitterHandle = data.twitterHandle ? (data.twitterHandle.startsWith("@") ? data.twitterHandle : `@${data.twitterHandle}`) : null;

  // TEMPORARY (Phase 3 → 4): legacy single-language form → PT fields.
  await prisma.seoSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      metaTitlePt: data.metaTitle,
      metaDescriptionPt: data.metaDescription,
      twitterHandle,
      robotsIndex: data.robotsIndex ?? true,
      ogImageId: data.ogImageId || null,
    },
    update: {
      metaTitlePt: data.metaTitle,
      metaDescriptionPt: data.metaDescription,
      twitterHandle,
      robotsIndex: data.robotsIndex ?? true,
      ogImageId: data.ogImageId || null,
    },
  });

  updateTag(CACHE_TAGS.seo);
  revalidatePath("/");
  return { ok: true };
}

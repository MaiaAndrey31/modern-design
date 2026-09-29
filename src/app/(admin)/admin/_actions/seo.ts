"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
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

  await prisma.seoSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      twitterHandle,
      robotsIndex: data.robotsIndex ?? true,
      ogImageId: data.ogImageId || null,
    },
    update: {
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      twitterHandle,
      robotsIndex: data.robotsIndex ?? true,
      ogImageId: data.ogImageId || null,
    },
  });

  updateTag(CACHE_TAGS.seo);
  revalidatePath("/");
  return { ok: true };
}

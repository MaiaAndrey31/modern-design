"use server";

import { redirect } from "next/navigation";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { releaseSchema } from "@/lib/validations/admin/release";
import type { ActionState } from "@/lib/validations/admin/actionState";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    yearLabel: formData.get("yearLabel") ?? "",
    type: formData.get("type") ?? "SINGLE",
    spotifyUrl: formData.get("spotifyUrl") ?? "",
    appleMusicUrl: formData.get("appleMusicUrl") ?? "",
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    published: formData.get("published") === "on",
    coverId: formData.get("coverId") ?? "",
  };
}

async function upsertRelease(id: string | null, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);
  const parsed = releaseSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const payload = {
    title: data.title,
    yearLabel: data.yearLabel,
    type: data.type,
    spotifyUrl: data.spotifyUrl || null,
    appleMusicUrl: data.appleMusicUrl || null,
    youtubeUrl: data.youtubeUrl || null,
    coverId: data.coverId || null,
    status: (data.published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };

  if (id) {
    await prisma.release.update({ where: { id }, data: payload });
  } else {
    const maxOrder = await prisma.release.aggregate({ _max: { sortOrder: true } });
    await prisma.release.create({ data: { ...payload, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
  }

  updateTag(CACHE_TAGS.releases);
  revalidatePath("/");
  redirect("/admin/releases");
}

export async function createReleaseAction(_prev: ActionState, formData: FormData) {
  return upsertRelease(null, formData);
}

export async function updateReleaseAction(id: string, _prev: ActionState, formData: FormData) {
  return upsertRelease(id, formData);
}

export async function deleteReleaseAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.release.delete({ where: { id } });
  updateTag(CACHE_TAGS.releases);
  revalidatePath("/");
}

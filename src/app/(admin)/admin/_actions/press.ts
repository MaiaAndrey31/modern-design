"use server";

import { redirect } from "next/navigation";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { pressItemSchema } from "@/lib/validations/admin/press";
import type { ActionState } from "@/lib/validations/admin/actionState";

function parseFormData(formData: FormData) {
  return {
    outlet: formData.get("outlet") ?? "",
    title: formData.get("title") ?? "",
    dateLabel: formData.get("dateLabel") ?? "",
    url: formData.get("url") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    published: formData.get("published") === "on",
    logoId: formData.get("logoId") ?? "",
  };
}

async function upsertPressItem(id: string | null, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);
  const parsed = pressItemSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const payload = {
    outlet: data.outlet,
    title: data.title,
    dateLabel: data.dateLabel,
    url: data.url || null,
    excerpt: data.excerpt || null,
    logoId: data.logoId || null,
    status: (data.published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };

  if (id) {
    await prisma.pressItem.update({ where: { id }, data: payload });
  } else {
    const maxOrder = await prisma.pressItem.aggregate({ _max: { sortOrder: true } });
    await prisma.pressItem.create({ data: { ...payload, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
  }

  updateTag(CACHE_TAGS.press);
  revalidatePath("/");
  redirect("/admin/press");
}

export async function createPressItemAction(_prev: ActionState, formData: FormData) {
  return upsertPressItem(null, formData);
}

export async function updatePressItemAction(id: string, _prev: ActionState, formData: FormData) {
  return upsertPressItem(id, formData);
}

export async function deletePressItemAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.pressItem.delete({ where: { id } });
  updateTag(CACHE_TAGS.press);
  revalidatePath("/");
}

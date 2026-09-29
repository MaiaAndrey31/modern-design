"use server";

import { redirect } from "next/navigation";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { showSchema } from "@/lib/validations/admin/show";
import type { ActionState } from "@/lib/validations/admin/actionState";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    date: formData.get("date") ?? "",
    time: formData.get("time") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    country: formData.get("country") ?? "",
    venue: formData.get("venue") ?? "",
    address: formData.get("address") ?? "",
    ticketUrl: formData.get("ticketUrl") ?? "",
    soldOut: formData.get("soldOut") === "on",
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    imageId: formData.get("imageId") ?? "",
  };
}

async function upsertShow(id: string | null, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = showSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const payload = {
    title: data.title || null,
    date: new Date(`${data.date}T00:00:00Z`),
    time: data.time || null,
    city: data.city,
    state: data.state || null,
    country: data.country || "Brasil",
    venue: data.venue,
    address: data.address || null,
    ticketUrl: data.ticketUrl || null,
    soldOut: data.soldOut ?? false,
    featured: data.featured ?? false,
    imageId: data.imageId || null,
    status: (data.published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };

  if (id) {
    await prisma.show.update({ where: { id }, data: payload });
  } else {
    await prisma.show.create({ data: payload });
  }

  updateTag(CACHE_TAGS.shows);
  revalidatePath("/");
  redirect("/admin/shows");
}

export async function createShowAction(_prev: ActionState, formData: FormData) {
  return upsertShow(null, formData);
}

export async function updateShowAction(id: string, _prev: ActionState, formData: FormData) {
  return upsertShow(id, formData);
}

export async function deleteShowAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.show.delete({ where: { id } });
  updateTag(CACHE_TAGS.shows);
  revalidatePath("/");
}

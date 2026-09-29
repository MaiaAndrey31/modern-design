"use server";

import { redirect } from "next/navigation";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { timelineEventSchema, worldStageSchema } from "@/lib/validations/admin/career";
import type { ActionState } from "@/lib/validations/admin/actionState";

// ---------- Timeline ----------

async function upsertTimelineEvent(id: string | null, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);
  const parsed = timelineEventSchema.safeParse({
    yearLabel: formData.get("yearLabel") ?? "",
    title: formData.get("title") ?? "",
    subtitle: formData.get("subtitle") ?? "",
    description: formData.get("description") ?? "",
    published: formData.get("published") === "on",
    imageId: formData.get("imageId") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const payload = {
    yearLabel: data.yearLabel,
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description,
    imageId: data.imageId || null,
    status: (data.published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };

  if (id) {
    await prisma.timelineEvent.update({ where: { id }, data: payload });
  } else {
    const maxOrder = await prisma.timelineEvent.aggregate({ _max: { sortOrder: true } });
    await prisma.timelineEvent.create({ data: { ...payload, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
  }

  updateTag(CACHE_TAGS.story);
  revalidatePath("/");
  redirect("/admin/career?tab=timeline");
}

export async function createTimelineEventAction(_prev: ActionState, formData: FormData) {
  return upsertTimelineEvent(null, formData);
}

export async function updateTimelineEventAction(id: string, _prev: ActionState, formData: FormData) {
  return upsertTimelineEvent(id, formData);
}

export async function deleteTimelineEventAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.timelineEvent.delete({ where: { id } });
  updateTag(CACHE_TAGS.story);
  revalidatePath("/");
}

/** Swaps sortOrder with the adjacent item — simple, no-code reordering without a full drag UI. */
export async function moveTimelineEventAction(id: string, direction: "up" | "down") {
  await requireRole(["ADMIN", "EDITOR"]);
  const items = await prisma.timelineEvent.findMany({ orderBy: { sortOrder: "asc" } });
  const index = items.findIndex((i) => i.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  await prisma.$transaction([
    prisma.timelineEvent.update({ where: { id: items[index].id }, data: { sortOrder: items[swapIndex].sortOrder } }),
    prisma.timelineEvent.update({ where: { id: items[swapIndex].id }, data: { sortOrder: items[index].sortOrder } }),
  ]);
  updateTag(CACHE_TAGS.story);
  revalidatePath("/");
}

// ---------- World Stages ----------

async function upsertWorldStage(id: string | null, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);
  const parsed = worldStageSchema.safeParse({
    yearLabel: formData.get("yearLabel") ?? "",
    title: formData.get("title") ?? "",
    location: formData.get("location") ?? "",
    description: formData.get("description") ?? "",
    showInNumbers: formData.get("showInNumbers") === "on",
    published: formData.get("published") === "on",
    imageId: formData.get("imageId") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const payload = {
    yearLabel: data.yearLabel,
    title: data.title,
    location: data.location,
    description: data.description,
    showInNumbers: data.showInNumbers ?? false,
    imageId: data.imageId || null,
    status: (data.published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };

  if (id) {
    await prisma.worldStage.update({ where: { id }, data: payload });
  } else {
    const maxOrder = await prisma.worldStage.aggregate({ _max: { sortOrder: true } });
    await prisma.worldStage.create({ data: { ...payload, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
  }

  updateTag(CACHE_TAGS.stages);
  revalidatePath("/");
  redirect("/admin/career?tab=stages");
}

export async function createWorldStageAction(_prev: ActionState, formData: FormData) {
  return upsertWorldStage(null, formData);
}

export async function updateWorldStageAction(id: string, _prev: ActionState, formData: FormData) {
  return upsertWorldStage(id, formData);
}

export async function deleteWorldStageAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.worldStage.delete({ where: { id } });
  updateTag(CACHE_TAGS.stages);
  revalidatePath("/");
}

export async function moveWorldStageAction(id: string, direction: "up" | "down") {
  await requireRole(["ADMIN", "EDITOR"]);
  const items = await prisma.worldStage.findMany({ orderBy: { sortOrder: "asc" } });
  const index = items.findIndex((i) => i.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  await prisma.$transaction([
    prisma.worldStage.update({ where: { id: items[index].id }, data: { sortOrder: items[swapIndex].sortOrder } }),
    prisma.worldStage.update({ where: { id: items[swapIndex].id }, data: { sortOrder: items[index].sortOrder } }),
  ]);
  updateTag(CACHE_TAGS.stages);
  revalidatePath("/");
}

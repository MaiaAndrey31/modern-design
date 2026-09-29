"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { bookingSettingsSchema } from "@/lib/validations/admin/booking";
import type { ActionState } from "@/lib/validations/admin/actionState";

export async function updateBookingSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = bookingSettingsSchema.safeParse({
    heading: formData.get("heading") ?? "",
    intro: formData.get("intro") ?? "",
    notifyEmail: formData.get("notifyEmail") ?? "",
    isFormEnabled: formData.get("isFormEnabled") === "on",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  await prisma.bookingSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", heading: data.heading, intro: data.intro, notifyEmail: data.notifyEmail || null, isFormEnabled: data.isFormEnabled ?? true },
    update: { heading: data.heading, intro: data.intro, notifyEmail: data.notifyEmail || null, isFormEnabled: data.isFormEnabled ?? true },
  });

  updateTag(CACHE_TAGS.booking);
  revalidatePath("/");
  return { ok: true };
}

export async function setBookingRequestStatusAction(id: string, status: "NEW" | "READ" | "REPLIED" | "ARCHIVED") {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.bookingRequest.update({ where: { id }, data: { status } });
}

export async function deleteBookingRequestAction(id: string) {
  await requireRole(["ADMIN", "EDITOR"]);
  await prisma.bookingRequest.delete({ where: { id } });
}

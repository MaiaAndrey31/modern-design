"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
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

  // TEMPORARY (Phase 3 → 4): heading/intro now live on Section("booking")
  // (PT fields); form settings on BookingSection.
  const { fieldLabels, ...bookingDefaults } = SYSTEM_DEFAULTS.booking;
  const settings = { notifyEmail: data.notifyEmail || null, isFormEnabled: data.isFormEnabled ?? true };
  await prisma.$transaction([
    prisma.bookingSection.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...bookingDefaults, fieldLabels, ...settings },
      update: settings,
    }),
    prisma.section.upsert({
      where: { key: "booking" },
      create: { key: "booking", sortOrder: SYSTEM_DEFAULTS.sections.booking.sortOrder, titlePt: data.heading, descriptionPt: data.intro },
      update: { titlePt: data.heading, descriptionPt: data.intro },
    }),
  ]);

  updateTag(CACHE_TAGS.booking);
  updateTag(CACHE_TAGS.sections);
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

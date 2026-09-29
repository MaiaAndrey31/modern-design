"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/admin/audit";

// Booking request inbox. The form copy/settings live in content.ts (BookingSection).

const statusSchema = z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]);
const idSchema = z.string().regex(/^c[a-z0-9]{20,32}$/i);

export async function setBookingRequestStatusAction(id: string, status: "NEW" | "READ" | "REPLIED" | "ARCHIVED") {
  await requireRole(CONTENT_ROLES);
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return;
  await prisma.bookingRequest.update({ where: { id: parsedId.data }, data: { status: parsedStatus.data } });
  revalidatePath("/admin/booking");
}

export async function deleteBookingRequestAction(id: string) {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  await prisma.bookingRequest.delete({ where: { id: parsed.data } });
  // Personal data of the requester is intentionally not copied into the audit trail.
  await audit({ userId: user.id, action: "delete", entity: "BookingRequest", entityId: parsed.data, summary: "Pedido de booking excluído" });
  revalidatePath("/admin/booking");
}

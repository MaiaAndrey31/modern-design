import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type AuditAction = "create" | "update" | "delete" | "reorder" | "toggle";

export interface AuditEntry {
  userId: string | null | undefined;
  action: AuditAction;
  /** Model name, e.g. "BrandSettings", "NavigationItem". */
  entity: string;
  entityId?: string | null;
  /** Short human summary shown in the dashboard's activity list. */
  summary?: string;
  /** The validated input that was written (never raw form data, never secrets). */
  diff?: Prisma.InputJsonValue;
}

/**
 * The CMS audit trail — the single writer of the AuditLog table.
 *
 * Called after a successful write. Best effort by design: a failure to record
 * the audit entry is logged but never undoes or blocks the content change the
 * admin just made.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary ?? null,
        ...(entry.diff !== undefined && { diff: entry.diff }),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", { entity: entry.entity, action: entry.action, error });
  }
}

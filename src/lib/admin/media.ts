import "server-only";
import { prisma } from "@/lib/db";
import type { MediaKind } from "@/generated/prisma/client";

/**
 * Checks that every chosen media id exists and has the expected kind
 * (an image slot can never end up holding a video, and vice versa).
 * Returns the offending field name, or null when everything is valid.
 */
export async function findInvalidMedia(fields: Record<string, { id: string | null | undefined; kind: MediaKind }>): Promise<string | null> {
  const entries = Object.entries(fields).filter(([, v]) => Boolean(v.id));
  if (entries.length === 0) return null;
  const rows = await prisma.media.findMany({
    where: { id: { in: entries.map(([, v]) => v.id!) } },
    select: { id: true, kind: true },
  });
  const kinds = new Map(rows.map((r) => [r.id, r.kind]));
  for (const [field, { id, kind }] of entries) if (kinds.get(id!) !== kind) return field;
  return null;
}

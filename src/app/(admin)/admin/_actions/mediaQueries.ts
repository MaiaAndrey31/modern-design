"use server";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getMediaUsage } from "@/lib/content/media";

export interface MediaListItem {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT";
  alt: string | null;
  title: string | null;
  folder: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
}

export async function listMedia(params: { folder?: string; search?: string; kind?: "IMAGE" | "VIDEO" } = {}): Promise<MediaListItem[]> {
  await requireRole(["ADMIN", "EDITOR"]);

  const rows = await prisma.media.findMany({
    where: {
      ...(params.folder && params.folder !== "all" ? { folder: params.folder } : {}),
      ...(params.kind ? { kind: params.kind } : {}),
      ...(params.search
        ? { OR: [{ alt: { contains: params.search, mode: "insensitive" } }, { title: { contains: params.search, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    kind: row.kind,
    alt: row.alt,
    title: row.title,
    folder: row.folder,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Where a media file is currently shown on the site — displayed in the library's edit dialog. */
export async function getMediaUsageLabels(id: string): Promise<string[]> {
  await requireRole(["ADMIN", "EDITOR"]);
  const usage = await getMediaUsage(id);
  return usage.usedIn;
}

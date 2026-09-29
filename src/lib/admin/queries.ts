import "server-only";
import { prisma } from "@/lib/db";
import { SYSTEM_DEFAULTS, type SectionDefaults } from "@/lib/content/defaults";
import type { SectionKey } from "@/lib/sections/registry";
import type { MediaValue } from "@/components/admin/MediaPickerField";

/** A Section row as the admin edits it — SYSTEM_DEFAULTS when not created yet. */
export async function loadSection(key: SectionKey): Promise<SectionDefaults> {
  const row = await prisma.section.findUnique({ where: { key } });
  return row ?? SYSTEM_DEFAULTS.sections[key];
}

/** Media row → picker value (id + url) or null. */
export function mediaValue(media: { id: string; url: string } | null | undefined): MediaValue | null {
  return media ? { id: media.id, url: media.url } : null;
}

/** Places as options for the chapter editor (name + whether it can frame the camera). */
export async function loadPlaceOptions() {
  const places = await prisma.place.findMany({ orderBy: [{ sortOrder: "asc" }, { namePt: "asc" }] });
  return places.map((p) => ({
    id: p.id,
    name: p.namePt,
    canFrame: p.cameraWidthDeg !== null,
    coords: `${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}`,
  }));
}

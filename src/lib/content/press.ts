import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedOptional } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toMediaRef } from "./mappers";
import { getProfile } from "./profile";
import type { PressItemDto, PressKitDto } from "./dto";

const pressQuery = unstable_cache(
  async (): Promise<PressItemDto[]> => {
    const rows = await prisma.pressItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { logo: true },
    });
    return rows.map((row) => ({
      id: row.id,
      outlet: row.outlet,
      title: row.title,
      date: row.dateLabel,
      url: row.url,
      excerpt: localizedOptional(row.excerptPt, row.excerptEn),
      logo: toMediaRef(row.logo),
    }));
  },
  ["content", "press"],
  { tags: [CACHE_TAGS.press, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

export const getPress = cache(pressQuery);

const pressKitQuery = unstable_cache(
  async () => {
    const row = await prisma.pressKitSection.findUnique({
      where: { id: SINGLETON_ID },
      include: { oneSheet: true, photoPack: true, logoPack: true },
    });
    const r = row ?? { ...SYSTEM_DEFAULTS.pressKit, oneSheet: null, photoPack: null, logoPack: null };
    return {
      bioOverride: localizedOptional(r.bioOverridePt, r.bioOverrideEn),
      downloadsNote: localizedOptional(r.downloadsNotePt, r.downloadsNoteEn),
      oneSheet: toMediaRef(r.oneSheet),
      photoPack: toMediaRef(r.photoPack),
      logoPack: toMediaRef(r.logoPack),
    };
  },
  ["content", "presskit"],
  { tags: [CACHE_TAGS.presskit, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

const cachedPressKitQuery = cache(pressKitQuery);

/** Bio falls back to Profile.bio. */
export async function getPressKit(): Promise<PressKitDto> {
  const [kit, profile] = await Promise.all([cachedPressKitQuery(), getProfile()]);
  return {
    bio: kit.bioOverride ?? profile.bio,
    downloadsNote: kit.downloadsNote,
    oneSheet: kit.oneSheet,
    photoPack: kit.photoPack,
    logoPack: kit.logoPack,
  };
}

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { SocialLinkDto } from "./dto";

const PLATFORM_MAP = {
  INSTAGRAM: "instagram",
  SPOTIFY: "spotify",
  APPLE_MUSIC: "appleMusic",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  WHATSAPP: "whatsapp",
} as const;

const FALLBACK: SocialLinkDto[] = [
  { platform: "instagram", label: "Instagram", url: "#", configured: false },
  { platform: "spotify", label: "Spotify", url: "#", configured: false },
  { platform: "appleMusic", label: "Apple Music", url: "#", configured: false },
];

const query = unstable_cache(
  async (): Promise<SocialLinkDto[]> => {
    const rows = await prisma.socialLink.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return FALLBACK;
    return rows.map((row) => ({
      platform: PLATFORM_MAP[row.platform],
      label: row.label,
      url: row.url,
      configured: row.isConfigured,
    }));
  },
  ["content", "social"],
  { tags: [CACHE_TAGS.social, CACHE_TAGS.all], revalidate: 3600 }
);

export const getSocialLinks = cache(query);

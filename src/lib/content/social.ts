import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getSocialPlatform, isSocialPlatformId } from "@/lib/social/registry";
import { CACHE_TAGS } from "./tags";
import type { SocialLinkDto } from "./dto";

const isHttps = (url: string) => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

const query = unstable_cache(
  async (): Promise<SocialLinkDto[]> => {
    const rows = await prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } });
    return rows
      .filter((row) => isHttps(row.url)) // no valid URL → no icon
      .map((row) => ({
        id: row.id,
        platform: isSocialPlatformId(row.platform) ? row.platform : "custom",
        label: row.label,
        url: row.url,
        icon: getSocialPlatform(row.platform).icon,
        showInHeader: row.showInHeader,
        showInFooter: row.showInFooter,
        showInMusic: row.showInMusic,
      }));
  },
  ["content", "social"],
  { tags: [CACHE_TAGS.social, CACHE_TAGS.all], revalidate: 3600 }
);

/** Enabled links with a valid https URL only. Empty list → no social icons anywhere. */
export const getSocialLinks = cache(query);

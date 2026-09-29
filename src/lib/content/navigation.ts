import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { NAVIGATION_LOCATIONS } from "@/lib/navigation/registry";
import { CACHE_TAGS } from "./tags";
import { toLink } from "./mappers";
import type { NavigationDto } from "./dto";

const query = unstable_cache(
  async (): Promise<NavigationDto> => {
    const rows = await prisma.navigationItem.findMany({
      where: { enabled: true },
      orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    });
    const nav = Object.fromEntries(NAVIGATION_LOCATIONS.map((l) => [l, []])) as unknown as NavigationDto;
    for (const row of rows) {
      // Invalid targets (e.g. a section key removed from the registry) are dropped, never rendered as dead links.
      const link = toLink(row.type, row.target, row.labelPt, row.labelEn, row.openInNewTab);
      if (link) nav[row.location].push(link);
    }
    return nav;
  },
  ["content", "navigation"],
  { tags: [CACHE_TAGS.navigation, CACHE_TAGS.all], revalidate: 3600 }
);

/**
 * Enabled menu items per location. SECTION links still need to be filtered
 * against the sections that actually render (see filterRenderedLinks in sections.ts).
 */
export const getNavigation = cache(query);

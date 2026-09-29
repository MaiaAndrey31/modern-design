import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { isFontId } from "@/lib/fonts/registry";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import type { TypographyDto } from "./dto";

const d = SYSTEM_DEFAULTS.typography;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const query = unstable_cache(
  async (): Promise<TypographyDto> => {
    const row = await prisma.typographySettings.findUnique({ where: { id: SINGLETON_ID } });
    if (!row) return { ...d };
    return {
      // Unknown ids (font removed from the registry) fall back to the role default.
      displayFontId: isFontId(row.displayFontId) ? row.displayFontId : d.displayFontId,
      headingFontId: isFontId(row.headingFontId) ? row.headingFontId : d.headingFontId,
      bodyFontId: isFontId(row.bodyFontId) ? row.bodyFontId : d.bodyFontId,
      displayWeight: clamp(row.displayWeight, 100, 900),
      headingWeight: clamp(row.headingWeight, 100, 900),
      bodyWeight: clamp(row.bodyWeight, 100, 900),
      displayTracking: clamp(row.displayTracking, -0.1, 0.5),
      headingTracking: clamp(row.headingTracking, -0.1, 0.5),
      typeScale: clamp(row.typeScale, 0.85, 1.15),
    };
  },
  ["content", "typography"],
  { tags: [CACHE_TAGS.typography, CACHE_TAGS.all], revalidate: 3600 }
);

/** Font roles (registry ids) + weights/tracking/scale. */
export const getTypography = cache(query);

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HEX_COLOR_PATTERN, THEME_COLOR_TOKENS } from "@/lib/theme/registry";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import type { ThemeDto } from "./dto";

const query = unstable_cache(
  async (): Promise<ThemeDto> => {
    const row = await prisma.themeSettings.findUnique({ where: { id: SINGLETON_ID } });
    const theme: ThemeDto = { ...SYSTEM_DEFAULTS.theme };
    if (!row) return theme;
    // Per-token fallback: a malformed value (e.g. edited by hand in SQL) can
    // never reach the CSS injector — it's replaced by the engine default.
    for (const { key } of THEME_COLOR_TOKENS) {
      const value = row[key];
      if (HEX_COLOR_PATTERN.test(value)) theme[key] = value;
    }
    theme.buttonRadius = row.buttonRadius;
    theme.cardRadius = row.cardRadius;
    return theme;
  },
  ["content", "theme"],
  { tags: [CACHE_TAGS.theme, CACHE_TAGS.all], revalidate: 3600 }
);

/** Colour + radius tokens (validated hex only). */
export const getTheme = cache(query);

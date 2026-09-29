import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { isLogoVariant } from "@/lib/navigation/registry";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toLink } from "./mappers";
import type { HeaderDto } from "./dto";

const query = unstable_cache(
  async (): Promise<HeaderDto> => {
    const row = (await prisma.headerSettings.findUnique({ where: { id: SINGLETON_ID } })) ?? SYSTEM_DEFAULTS.header;
    return {
      logoVariant: isLogoVariant(row.logoVariant) ? row.logoVariant : "primary",
      showLanguageSwitch: row.showLanguageSwitch,
      showSocials: row.showSocials,
      cta: row.showCta ? toLink(row.ctaType, row.ctaTarget, row.ctaLabelPt, row.ctaLabelEn) : null,
    };
  },
  ["content", "header"],
  { tags: [CACHE_TAGS.header, CACHE_TAGS.all], revalidate: 3600 }
);

export const getHeader = cache(query);

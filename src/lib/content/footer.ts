import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedOptional } from "@/lib/i18n/locale";
import { isLogoVariant } from "@/lib/navigation/registry";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { localizedOr, toLink } from "./mappers";
import type { FooterDto } from "./dto";

const d = SYSTEM_DEFAULTS.footer;

const query = unstable_cache(
  async (): Promise<FooterDto> => {
    const row = (await prisma.footerSettings.findUnique({ where: { id: SINGLETON_ID } })) ?? d;
    return {
      logoVariant: isLogoVariant(row.logoVariant) ? row.logoVariant : "primary",
      showWordmark: row.showWordmark,
      description: localizedOptional(row.descriptionPt, row.descriptionEn),
      copyright: localizedOr(row.copyrightPt, row.copyrightEn, { pt: d.copyrightPt, en: d.copyrightEn }),
      backToTopLabel: localizedOr(row.backToTopLabelPt, row.backToTopLabelEn, { pt: d.backToTopLabelPt, en: d.backToTopLabelEn }),
      bookingCta: row.showBookingCta ? toLink(row.bookingType, row.bookingTarget, row.bookingLabelPt, row.bookingLabelEn) : null,
      showSocials: row.showSocials,
      showContact: row.showContact,
    };
  },
  ["content", "footer"],
  { tags: [CACHE_TAGS.footer, CACHE_TAGS.all], revalidate: 3600 }
);

export const getFooter = cache(query);

/** Replaces the {year} / {brand} tokens of a copyright template. */
export function formatCopyright(template: string, brandName: string, year = new Date().getFullYear()): string {
  return template.replaceAll("{year}", String(year)).replaceAll("{brand}", brandName);
}

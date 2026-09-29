import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { SiteDto } from "./dto";

const FALLBACK: SiteDto = {
  artistName: "Alan Saher",
  roles: ["DJ", "Producer", "Entertainer"],
  startYear: 1993,
  tagline: "30+ Years. One Sound. Thousands of Stories.",
  originStatement: "From Minas to the World.",
  signaturePhrase: "Pegada Monstra",
  bioShort:
    "For more than three decades, Alan Saher has taken his sound from the nightclubs of the Sul de Minas to some of the world's biggest stages.",
  bioFull:
    "Alan Saher began his career in 1993. In 1998, he was recognized in a competition promoted by Rádio Atenas FM, which highlighted him as a leading DJ in the Sul de Minas region.",
  whatsappNumber: null,
  footerNote: "Built as a digital experience — not a template.",
};

const query = unstable_cache(
  async (): Promise<SiteDto> => {
    const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!row) return FALLBACK;
    return {
      artistName: row.artistName,
      roles: row.roles,
      startYear: row.startYear,
      tagline: row.tagline,
      originStatement: row.originStatement,
      signaturePhrase: row.signaturePhrase,
      bioShort: row.bioShort,
      bioFull: row.bioFull,
      whatsappNumber: row.whatsappNumber,
      footerNote: row.footerNote,
    };
  },
  ["content", "site"],
  { tags: [CACHE_TAGS.site, CACHE_TAGS.all], revalidate: 3600 }
);

/** Falls back to sensible defaults if SiteSettings hasn't been seeded yet — the site must never break on this. */
export const getSiteSettings = cache(query);

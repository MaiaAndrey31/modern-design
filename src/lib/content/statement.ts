import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedList } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toMediaRef } from "./mappers";
import type { StatementDto } from "./dto";

const query = unstable_cache(
  async (): Promise<StatementDto> => {
    const row = await prisma.statementSection.findUnique({
      where: { id: SINGLETON_ID },
      include: { backgroundImage: true },
    });
    const r = row ?? { ...SYSTEM_DEFAULTS.statement, backgroundImage: null };
    const lines = localizedList(r.linesPt, r.linesEn);
    return {
      lines,
      accentIndex: r.accentIndex !== null && r.accentIndex < lines.pt.length ? r.accentIndex : null,
      backgroundImage: toMediaRef(r.backgroundImage),
      showGlobe: r.showGlobe,
    };
  },
  ["content", "statement"],
  { tags: [CACHE_TAGS.statement, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** No lines → the section renders nothing (it isn't shown empty). */
export const getStatement = cache(query);

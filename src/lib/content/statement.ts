import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { StatementDto } from "./dto";

const FALLBACK: StatementDto = { lines: ["From Minas", "to the", "World."], accentIndex: 2, backgroundUrl: null };

const query = unstable_cache(
  async (): Promise<StatementDto> => {
    const row = await prisma.statementSection.findUnique({
      where: { id: "singleton" },
      include: { backgroundImage: true },
    });
    if (!row || !row.isVisible) return { lines: [], accentIndex: null, backgroundUrl: null };
    return {
      lines: row.lines.length > 0 ? row.lines : FALLBACK.lines,
      accentIndex: row.accentIndex,
      backgroundUrl: row.backgroundImage?.url ?? null,
    };
  },
  ["content", "statement"],
  { tags: [CACHE_TAGS.statement, CACHE_TAGS.all], revalidate: 3600 }
);

export const getStatement = cache(query);

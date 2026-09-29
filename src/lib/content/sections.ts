import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedOptional } from "@/lib/i18n/locale";
import { SECTION_KEYS, SECTION_REGISTRY, isSectionKey, type SectionKey } from "@/lib/sections/registry";
import { CACHE_TAGS } from "./tags";
import { SYSTEM_DEFAULTS, type SectionDefaults } from "./defaults";
import { toLink } from "./mappers";
import type { LinkDto, SectionDto, SectionsDto } from "./dto";

function toSectionDto(key: SectionKey, row: SectionDefaults): SectionDto {
  const def = SECTION_REGISTRY[key];
  return {
    key,
    // Non-toggleable sections (Hero) are always on, whatever the row says.
    enabled: def.toggleable ? row.enabled : true,
    sortOrder: row.sortOrder,
    anchor: def.anchor,
    eyebrow: localizedOptional(row.eyebrowPt, row.eyebrowEn),
    title: localizedOptional(row.titlePt, row.titleEn),
    subtitle: localizedOptional(row.subtitlePt, row.subtitleEn),
    description: localizedOptional(row.descriptionPt, row.descriptionEn),
    emptyText: localizedOptional(row.emptyTextPt, row.emptyTextEn),
    cta: toLink(row.ctaType, row.ctaTarget, row.ctaLabelPt, row.ctaLabelEn),
  };
}

const query = unstable_cache(
  async (): Promise<SectionsDto> => {
    const rows = await prisma.section.findMany();
    const byKey = {} as Record<SectionKey, SectionDto>;
    for (const key of SECTION_KEYS) byKey[key] = toSectionDto(key, SYSTEM_DEFAULTS.sections[key]);
    // Rows whose key the registry no longer knows are ignored (their component is gone).
    for (const row of rows) if (isSectionKey(row.key)) byKey[row.key] = toSectionDto(row.key, row);

    const rank = (key: SectionKey) => (SECTION_REGISTRY[key].position === "first" ? 0 : 1);
    const ordered = SECTION_KEYS.filter((key) => byKey[key].enabled).sort(
      (a, b) =>
        rank(a) - rank(b) ||
        byKey[a].sortOrder - byKey[b].sortOrder ||
        SECTION_REGISTRY[a].defaultSortOrder - SECTION_REGISTRY[b].defaultSortOrder
    );
    return { byKey, ordered };
  },
  ["content", "sections"],
  { tags: [CACHE_TAGS.sections, CACHE_TAGS.all], revalidate: 3600 }
);

/** Visibility, order and generic copy of every section. Missing rows → SYSTEM_DEFAULTS. */
export const getSections = cache(query);

/** Drops SECTION links whose section isn't rendered (disabled or empty) — never a dead scroll target. */
export function filterRenderedLinks(links: LinkDto[], rendered: ReadonlySet<SectionKey>): LinkDto[] {
  return links.filter((link) => link.sectionKey === null || rendered.has(link.sectionKey));
}

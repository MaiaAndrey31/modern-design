import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized, localizedList, localizedOptional } from "@/lib/i18n/locale";
import { isLabelPosition, isStoryVisualType, STORY_LIMITS } from "@/lib/story/registry";
import type { Place } from "@/generated/prisma/client";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { toMediaRef } from "./mappers";
import type { PlaceDto, StoryChapterDto, StoryDto } from "./dto";

const within = (value: number, range: { min: number; max: number }) => value >= range.min && value <= range.max;

/** Rows outside the safe ranges (e.g. edited by hand in SQL) are dropped — they'd break the map/globe. */
function toPlaceDto(row: Place): PlaceDto | null {
  if (!within(row.latitude, STORY_LIMITS.latitude) || !within(row.longitude, STORY_LIMITS.longitude)) return null;
  return {
    id: row.id,
    name: localized(row.namePt, row.nameEn),
    latitude: row.latitude,
    longitude: row.longitude,
    labelPosition: isLabelPosition(row.labelPosition) ? row.labelPosition : "right",
    cameraWidthDeg:
      row.cameraWidthDeg !== null && within(row.cameraWidthDeg, STORY_LIMITS.cameraWidthDeg) ? row.cameraWidthDeg : null,
    isOrigin: row.isOrigin,
    showOnGlobe: row.showOnGlobe,
    globeOrder: row.globeOrder,
  };
}

const query = unstable_cache(
  async (): Promise<StoryDto> => {
    const [section, chapterRows, globePlaces] = await Promise.all([
      prisma.storySection.findUnique({ where: { id: SINGLETON_ID } }),
      prisma.storyChapter.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        take: STORY_LIMITS.maxPublishedChapters,
        include: { image: true, places: { include: { place: true }, orderBy: { sortOrder: "asc" } } },
      }),
      prisma.place.findMany({ where: { OR: [{ showOnGlobe: true }, { isOrigin: true }] } }),
    ]);

    const places = new Map<string, PlaceDto>();
    const keep = (row: Place) => {
      const dto = places.get(row.id) ?? toPlaceDto(row);
      if (dto) places.set(row.id, dto);
      return dto;
    };
    globePlaces.forEach(keep);

    let globalActTaken = false;
    const chapters: StoryChapterDto[] = chapterRows.map((row) => {
      const byRole = (role: string) => row.places.filter((l) => l.role === role && keep(l.place)).map((l) => l.placeId);
      const cameraPlaceIds = row.places
        .filter((l) => l.role === "CAMERA" && keep(l.place)?.cameraWidthDeg != null)
        .map((l) => l.placeId);
      const [from] = byRole("ROUTE_FROM");
      const [to] = byRole("ROUTE_TO");
      const period = localized(row.periodLabelPt, row.periodLabelEn);
      // Only the first chapter flagged as the start of the global act counts.
      const startsGlobalAct = row.startsGlobalAct && !globalActTaken;
      if (startsGlobalAct) globalActTaken = true;
      return {
        id: row.id,
        periodLabel: period,
        axisLabel: row.axisLabel,
        ghostLabel: localizedOptional(row.ghostLabelPt, row.ghostLabelEn) ?? {
          pt: period.pt.slice(0, 4),
          en: period.en.slice(0, 4),
        },
        concept: localized(row.conceptPt, row.conceptEn),
        title: localized(row.titlePt, row.titleEn),
        placeLabel: localizedOptional(row.placeLabelPt, row.placeLabelEn),
        text: localized(row.textPt, row.textEn),
        pullQuote: localizedOptional(row.pullQuotePt, row.pullQuoteEn),
        visualType: isStoryVisualType(row.visualType) ? row.visualType : "map",
        image: toMediaRef(row.image),
        allowPhoto: row.allowPhoto,
        showRings: row.showRings,
        startsGlobalAct,
        scrollWeight: Math.min(STORY_LIMITS.scrollWeight.max, Math.max(STORY_LIMITS.scrollWeight.min, row.scrollWeight)),
        cameraPlaceIds,
        labelPlaceIds: byRole("LABEL"),
        pulsePlaceId: byRole("PULSE")[0] ?? null,
        route: from && to && from !== to ? { fromPlaceId: from, toPlaceId: to } : null,
      };
    });

    const s = section ?? SYSTEM_DEFAULTS.story;
    return {
      introQuestion: localizedOptional(s.introQuestionPt, s.introQuestionEn),
      thesisLines: localizedList(s.thesisLinesPt, s.thesisLinesEn),
      outroLines: localizedList(s.outroLinesPt, s.outroLinesEn),
      chapters,
      places: [...places.values()],
    };
  },
  ["content", "story"],
  { tags: [CACHE_TAGS.story, CACHE_TAGS.places, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Published chapters (ordered) + every place they or the globe need. No chapters → the Story renders nothing. */
export const getStory = cache(query);

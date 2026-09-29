import { z } from "zod";
import { LABEL_POSITIONS, STORY_LIMITS, STORY_VISUAL_TYPES } from "@/lib/story/registry";
import { entityId, optionalMediaId, optionalText, ptText, sortOrder } from "./common";

const { latitude, longitude, cameraWidthDeg, scrollWeight } = STORY_LIMITS;

export const placeSchema = z.object({
  namePt: ptText(80, "Nome"),
  nameEn: optionalText(80),
  latitude: z.coerce
    .number("Latitude inválida.")
    .min(latitude.min, `Latitude entre ${latitude.min} e ${latitude.max}.`)
    .max(latitude.max, `Latitude entre ${latitude.min} e ${latitude.max}.`),
  longitude: z.coerce
    .number("Longitude inválida.")
    .min(longitude.min, `Longitude entre ${longitude.min} e ${longitude.max}.`)
    .max(longitude.max, `Longitude entre ${longitude.min} e ${longitude.max}.`),
  labelPosition: z.enum(LABEL_POSITIONS),
  cameraWidthDeg: z
    .union([
      z.literal(""),
      z.null(),
      z.coerce
        .number()
        .min(cameraWidthDeg.min, `Largura entre ${cameraWidthDeg.min}° e ${cameraWidthDeg.max}°.`)
        .max(cameraWidthDeg.max, `Largura entre ${cameraWidthDeg.min}° e ${cameraWidthDeg.max}°.`),
    ]).optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  isOrigin: z.boolean(),
  showOnGlobe: z.boolean(),
  globeOrder: z
    .union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(100)]).optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  sortOrder,
});
export type PlaceInput = z.infer<typeof placeSchema>;

/**
 * Chapter ↔ place links, grouped by role. Cross-row rules (a camera place
 * must have cameraWidthDeg; at most one origin / one global-act chapter) are
 * checked in the admin action against the DB, since they depend on other rows.
 */
export const chapterPlacesSchema = z
  .object({
    cameraPlaceIds: z.array(entityId).max(4, "No máximo 4 enquadramentos em sequência."),
    labelPlaceIds: z.array(entityId).max(6, "No máximo 6 rótulos por capítulo."),
    pulsePlaceId: entityId.nullish().transform((v) => v ?? null),
    routeFromPlaceId: entityId.nullish().transform((v) => v ?? null),
    routeToPlaceId: entityId.nullish().transform((v) => v ?? null),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.routeFromPlaceId) !== Boolean(value.routeToPlaceId)) {
      ctx.addIssue({ code: "custom", path: ["routeToPlaceId"], message: "Uma rota precisa de origem e destino." });
    }
    if (value.routeFromPlaceId && value.routeFromPlaceId === value.routeToPlaceId) {
      ctx.addIssue({ code: "custom", path: ["routeToPlaceId"], message: "Origem e destino devem ser lugares diferentes." });
    }
    if (new Set(value.labelPlaceIds).size !== value.labelPlaceIds.length) {
      ctx.addIssue({ code: "custom", path: ["labelPlaceIds"], message: "Lugar repetido." });
    }
  });
export type ChapterPlacesInput = z.infer<typeof chapterPlacesSchema>;

export const storyChapterSchema = z.object({
  periodLabelPt: ptText(24, "Período"),
  periodLabelEn: optionalText(24),
  axisLabel: optionalText(12),
  ghostLabelPt: optionalText(8),
  ghostLabelEn: optionalText(8),
  conceptPt: ptText(40, "Conceito"),
  conceptEn: optionalText(40),
  titlePt: ptText(120, "Título"),
  titleEn: optionalText(120),
  placeLabelPt: optionalText(120),
  placeLabelEn: optionalText(120),
  textPt: ptText(1200, "Texto"),
  textEn: optionalText(1200),
  pullQuotePt: optionalText(160),
  pullQuoteEn: optionalText(160),
  visualType: z.enum(STORY_VISUAL_TYPES),
  imageId: optionalMediaId,
  allowPhoto: z.boolean(),
  showRings: z.boolean(),
  startsGlobalAct: z.boolean(),
  scrollWeight: z.coerce.number().min(scrollWeight.min).max(scrollWeight.max),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  places: chapterPlacesSchema,
});
export type StoryChapterInput = z.infer<typeof storyChapterSchema>;

import { z } from "zod";
import { BOOKING_FORM_FIELDS, type BookingFormField } from "@/lib/booking/fields";
import { SECTION_KEYS, SECTION_REGISTRY, type SectionKey } from "@/lib/sections/registry";
import { STORY_LIMITS } from "@/lib/story/registry";
import { parseYouTubeId } from "@/lib/youtube";
import { lines, optionalEmail, optionalLink, optionalMediaId, optionalText, ptText } from "./common";

// ---------------------------------------------------------------------------
// Generic Section row
// ---------------------------------------------------------------------------

export const sectionKey = z.enum(SECTION_KEYS);

export const sectionSchema = z
  .object({
    key: sectionKey,
    enabled: z.boolean(),
    eyebrowPt: optionalText(80),
    eyebrowEn: optionalText(80),
    titlePt: optionalText(200),
    titleEn: optionalText(200),
    subtitlePt: optionalText(200),
    subtitleEn: optionalText(200),
    descriptionPt: optionalText(1000),
    descriptionEn: optionalText(1000),
    emptyTextPt: optionalText(400),
    emptyTextEn: optionalText(400),
    cta: optionalLink,
  })
  .superRefine((value, ctx) => {
    const def = SECTION_REGISTRY[value.key];
    if (!def.toggleable && !value.enabled) {
      ctx.addIssue({ code: "custom", path: ["enabled"], message: `${def.label} não pode ser desativada.` });
    }
  });
export type SectionInput = z.infer<typeof sectionSchema>;

/**
 * New order for the flow sections (everything but "first" sections). Must be
 * a permutation of exactly those keys — no duplicates, none missing.
 */
export const FLOW_SECTION_KEYS: SectionKey[] = SECTION_KEYS.filter((k) => SECTION_REGISTRY[k].position === "flow");

export const sectionOrderSchema = z
  .array(sectionKey)
  .refine(
    (keys) => keys.length === FLOW_SECTION_KEYS.length && new Set(keys).size === keys.length && keys.every((k) => FLOW_SECTION_KEYS.includes(k)),
    "A ordem precisa conter cada seção exatamente uma vez (o Hero é sempre o primeiro)."
  );

// ---------------------------------------------------------------------------
// Section-specific singletons
// ---------------------------------------------------------------------------

const youtubeUrl = z
  .union([z.string().trim().max(500), z.null()]).optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || parseYouTubeId(v) !== null, "Link do YouTube inválido.");

export const heroSectionSchema = z.object({
  headlineLinesPt: lines(4, 40),
  headlineLinesEn: lines(4, 40),
  backgroundImageId: optionalMediaId,
  videoId: optionalMediaId,
  posterImageId: optionalMediaId,
  youtubeUrl,
  enableWebgl: z.boolean(),
  foundedLabelPt: optionalText(24),
  foundedLabelEn: optionalText(24),
  primaryCta: optionalLink,
  secondaryCta: optionalLink,
});
export type HeroSectionInput = z.infer<typeof heroSectionSchema>;

export const statementSectionSchema = z
  .object({
    linesPt: lines(6, 60),
    linesEn: lines(6, 60),
    accentIndex: z
      .union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(5)]).optional()
      .transform((v) => (typeof v === "number" ? v : null)),
    backgroundImageId: optionalMediaId,
    showGlobe: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.accentIndex !== null && value.accentIndex >= value.linesPt.length) {
      ctx.addIssue({ code: "custom", path: ["accentIndex"], message: "A linha em destaque não existe." });
    }
  });
export type StatementSectionInput = z.infer<typeof statementSectionSchema>;

export const narrativeSectionSchema = z.object({
  linesPt: lines(8, 80),
  linesEn: lines(8, 80),
  finalWordPt: optionalText(40),
  finalWordEn: optionalText(40),
  vhPerLine: z.coerce.number().int().min(STORY_LIMITS.narrativeVhPerLine.min).max(STORY_LIMITS.narrativeVhPerLine.max),
  backgroundImageId: optionalMediaId,
});
export type NarrativeSectionInput = z.infer<typeof narrativeSectionSchema>;

export const storySectionSchema = z.object({
  introQuestionPt: optionalText(80),
  introQuestionEn: optionalText(80),
  thesisLinesPt: lines(4, 60),
  thesisLinesEn: lines(4, 60),
  outroLinesPt: lines(4, 80),
  outroLinesEn: lines(4, 80),
});
export type StorySectionInput = z.infer<typeof storySectionSchema>;

export const pressKitSectionSchema = z.object({
  bioOverridePt: optionalText(4000),
  bioOverrideEn: optionalText(4000),
  oneSheetId: optionalMediaId,
  photoPackId: optionalMediaId,
  logoPackId: optionalMediaId,
  downloadsNotePt: optionalText(200),
  downloadsNoteEn: optionalText(200),
});
export type PressKitSectionInput = z.infer<typeof pressKitSectionSchema>;

// ---------------------------------------------------------------------------
// Booking — `fieldLabels` is the project's only JSON content column. Its
// shape is derived from BOOKING_FORM_FIELDS; the admin edits it through
// fixed inputs (one PT/EN pair per field), never as free JSON, and the site
// parses it with this schema before use.
// ---------------------------------------------------------------------------

const fieldLabel = z.object({
  pt: z.string().trim().min(1).max(60),
  en: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const bookingFieldLabelsSchema = z
  .object(Object.fromEntries(BOOKING_FORM_FIELDS.map((f) => [f, fieldLabel])) as Record<BookingFormField, typeof fieldLabel>)
  .strict();
export type BookingFieldLabelsInput = z.infer<typeof bookingFieldLabelsSchema>;

export const bookingSectionSchema = z.object({
  successTitlePt: ptText(120, "Título de sucesso"),
  successTitleEn: optionalText(120),
  successMessagePt: ptText(300, "Mensagem de sucesso"),
  successMessageEn: optionalText(300),
  submitLabelPt: ptText(40, "Texto do botão"),
  submitLabelEn: optionalText(40),
  pausedMessagePt: ptText(300, "Mensagem de pausa"),
  pausedMessageEn: optionalText(300),
  fieldLabels: bookingFieldLabelsSchema,
  notifyEmail: optionalEmail,
  isFormEnabled: z.boolean(),
});
export type BookingSectionInput = z.infer<typeof bookingSectionSchema>;

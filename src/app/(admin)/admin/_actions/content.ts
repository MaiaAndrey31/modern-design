"use server";

import { prisma } from "@/lib/db";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { findInvalidMedia } from "@/lib/admin/media";
import { bool, link, lines, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { BOOKING_FORM_FIELDS } from "@/lib/booking/fields";
import {
  bookingSectionSchema,
  heroSectionSchema,
  narrativeSectionSchema,
  pressKitSectionSchema,
  statementSectionSchema,
  storySectionSchema,
} from "@/lib/validations/cms/sections";
import { experienceFrameSchema } from "@/lib/validations/cms/collections";
import type { ActionState } from "@/lib/validations/admin/actionState";

const mediaError = (field: string): ActionState => ({
  ok: false,
  error: "Uma das mídias escolhidas é inválida.",
  fieldErrors: { [field]: ["Escolha um arquivo do tipo correto."] },
});

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export async function updateHeroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const backgroundType = text(formData, "backgroundType");

  const parsed = heroSectionSchema.safeParse({
    headlineLinesPt: lines(formData, "headlineLinesPt"),
    headlineLinesEn: lines(formData, "headlineLinesEn"),
    backgroundImageId: text(formData, "backgroundImageId"),
    // Only the selected background type is kept, so the site never shows a stale video.
    videoId: backgroundType === "video" ? text(formData, "videoId") : "",
    posterImageId: backgroundType === "video" ? text(formData, "posterImageId") : "",
    youtubeUrl: backgroundType === "youtube" ? text(formData, "youtubeUrl") : "",
    enableWebgl: bool(formData, "enableWebgl"),
    foundedLabelPt: text(formData, "foundedLabelPt"),
    foundedLabelEn: text(formData, "foundedLabelEn"),
    primaryCta: link(formData, "primaryCta"),
    secondaryCta: link(formData, "secondaryCta"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { primaryCta, secondaryCta, ...d } = parsed.data;

  if (backgroundType === "video" && !d.videoId) return { ok: false, error: "Escolha o vídeo do Hero.", fieldErrors: { videoId: ["Obrigatório."] } };
  if (backgroundType === "youtube" && !d.youtubeUrl) return { ok: false, error: "Informe o link do YouTube.", fieldErrors: { youtubeUrl: ["Obrigatório."] } };
  const bad = await findInvalidMedia({
    backgroundImageId: { id: d.backgroundImageId, kind: "IMAGE" },
    posterImageId: { id: d.posterImageId, kind: "IMAGE" },
    videoId: { id: d.videoId, kind: "VIDEO" },
  });
  if (bad) return mediaError(bad);

  const data = {
    ...d,
    primaryCtaLabelPt: primaryCta.labelPt,
    primaryCtaLabelEn: primaryCta.labelEn,
    primaryCtaType: primaryCta.type ?? "SECTION",
    primaryCtaTarget: primaryCta.labelPt ? primaryCta.target : null,
    secondaryCtaLabelPt: secondaryCta.labelPt,
    secondaryCtaLabelEn: secondaryCta.labelEn,
    secondaryCtaType: secondaryCta.type ?? "SECTION",
    secondaryCtaTarget: secondaryCta.labelPt ? secondaryCta.target : null,
  };
  await prisma.heroSection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...data }, update: data });

  await audit({ userId: user.id, action: "update", entity: "HeroSection", entityId: SINGLETON_ID, summary: "Hero", diff: data });
  invalidate(CACHE_TAGS.hero);
  return saved();
}

// ---------------------------------------------------------------------------
// Statement / Narrative / Story interludes
// ---------------------------------------------------------------------------

export async function updateStatementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = statementSectionSchema.safeParse({
    linesPt: lines(formData, "linesPt"),
    linesEn: lines(formData, "linesEn"),
    accentIndex: text(formData, "accentIndex"),
    backgroundImageId: text(formData, "backgroundImageId"),
    showGlobe: bool(formData, "showGlobe"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const bad = await findInvalidMedia({ backgroundImageId: { id: parsed.data.backgroundImageId, kind: "IMAGE" } });
  if (bad) return mediaError(bad);

  await prisma.statementSection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });
  await audit({ userId: user.id, action: "update", entity: "StatementSection", entityId: SINGLETON_ID, summary: "Statement", diff: parsed.data });
  invalidate(CACHE_TAGS.statement);
  return saved();
}

export async function updateNarrativeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = narrativeSectionSchema.safeParse({
    linesPt: lines(formData, "linesPt"),
    linesEn: lines(formData, "linesEn"),
    finalWordPt: text(formData, "finalWordPt"),
    finalWordEn: text(formData, "finalWordEn"),
    vhPerLine: text(formData, "vhPerLine"),
    backgroundImageId: text(formData, "backgroundImageId"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const bad = await findInvalidMedia({ backgroundImageId: { id: parsed.data.backgroundImageId, kind: "IMAGE" } });
  if (bad) return mediaError(bad);

  await prisma.narrativeSection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });
  await audit({ userId: user.id, action: "update", entity: "NarrativeSection", entityId: SINGLETON_ID, summary: "Transição narrativa", diff: parsed.data });
  invalidate(CACHE_TAGS.narrative);
  return saved();
}

export async function updateStorySectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = storySectionSchema.safeParse({
    introQuestionPt: text(formData, "introQuestionPt"),
    introQuestionEn: text(formData, "introQuestionEn"),
    thesisLinesPt: lines(formData, "thesisLinesPt"),
    thesisLinesEn: lines(formData, "thesisLinesEn"),
    outroLinesPt: lines(formData, "outroLinesPt"),
    outroLinesEn: lines(formData, "outroLinesEn"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await prisma.storySection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });
  await audit({ userId: user.id, action: "update", entity: "StorySection", entityId: SINGLETON_ID, summary: "História — abertura e encerramento", diff: parsed.data });
  invalidate(CACHE_TAGS.story);
  return saved();
}

// ---------------------------------------------------------------------------
// Press Kit
// ---------------------------------------------------------------------------

export async function updatePressKitAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = pressKitSectionSchema.safeParse({
    bioOverridePt: text(formData, "bioOverridePt"),
    bioOverrideEn: text(formData, "bioOverrideEn"),
    oneSheetId: text(formData, "oneSheetId"),
    photoPackId: text(formData, "photoPackId"),
    logoPackId: text(formData, "logoPackId"),
    downloadsNotePt: text(formData, "downloadsNotePt"),
    downloadsNoteEn: text(formData, "downloadsNoteEn"),
  });
  if (!parsed.success) return invalid(parsed.error);
  // The upload pipeline currently accepts images/videos only (PDF/ZIP come with the Phase 7 media work).
  const bad = await findInvalidMedia({
    oneSheetId: { id: parsed.data.oneSheetId, kind: "IMAGE" },
    photoPackId: { id: parsed.data.photoPackId, kind: "IMAGE" },
    logoPackId: { id: parsed.data.logoPackId, kind: "IMAGE" },
  });
  if (bad) return mediaError(bad);

  await prisma.pressKitSection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });
  await audit({ userId: user.id, action: "update", entity: "PressKitSection", entityId: SINGLETON_ID, summary: "Press Kit", diff: parsed.data });
  invalidate(CACHE_TAGS.presskit);
  return saved();
}

// ---------------------------------------------------------------------------
// Booking form copy (the request inbox lives in booking.ts)
// ---------------------------------------------------------------------------

export async function updateBookingSectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  // fieldLabels is assembled from fixed inputs (one PT/EN pair per known field) — never free JSON.
  const fieldLabels = Object.fromEntries(
    BOOKING_FORM_FIELDS.map((field) => [field, { pt: text(formData, `label_${field}_pt`), en: text(formData, `label_${field}_en`) }])
  );
  const parsed = bookingSectionSchema.safeParse({
    successTitlePt: text(formData, "successTitlePt"),
    successTitleEn: text(formData, "successTitleEn"),
    successMessagePt: text(formData, "successMessagePt"),
    successMessageEn: text(formData, "successMessageEn"),
    submitLabelPt: text(formData, "submitLabelPt"),
    submitLabelEn: text(formData, "submitLabelEn"),
    pausedMessagePt: text(formData, "pausedMessagePt"),
    pausedMessageEn: text(formData, "pausedMessageEn"),
    fieldLabels,
    notifyEmail: text(formData, "notifyEmail"),
    isFormEnabled: bool(formData, "isFormEnabled"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await prisma.bookingSection.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...parsed.data }, update: parsed.data });
  // The notification address is operational data — kept out of the audit trail.
  await audit({
    userId: user.id,
    action: "update",
    entity: "BookingSection",
    entityId: SINGLETON_ID,
    summary: "Booking — formulário",
    diff: { ...parsed.data, notifyEmail: parsed.data.notifyEmail ? "(definido)" : null },
  });
  invalidate(CACHE_TAGS.booking);
  return saved();
}

// ---------------------------------------------------------------------------
// Experience frames (fixed 4-slot grid)
// ---------------------------------------------------------------------------

export async function updateExperienceFrameAction(slot: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = experienceFrameSchema.safeParse({
    slot,
    layout: text(formData, "layout"),
    offsetPx: text(formData, "offsetPx"),
    mediaId: text(formData, "mediaId"),
    altPt: text(formData, "altPt"),
    altEn: text(formData, "altEn"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.status === "PUBLISHED" && !parsed.data.mediaId) return failed("Escolha uma imagem antes de publicar o quadro.");
  const bad = await findInvalidMedia({ mediaId: { id: parsed.data.mediaId, kind: "IMAGE" } });
  if (bad) return mediaError(bad);

  const data = { ...parsed.data, slot };
  await prisma.experienceFrame.upsert({ where: { slot }, create: data, update: data });
  await audit({ userId: user.id, action: "update", entity: "ExperienceFrame", entityId: String(slot), summary: `Experience — quadro ${slot}`, diff: parsed.data });
  invalidate(CACHE_TAGS.experience);
  return saved();
}

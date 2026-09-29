"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CONTENT_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { findInvalidMedia } from "@/lib/admin/media";
import { all, bool, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { STORY_LIMITS } from "@/lib/story/registry";
import { placeSchema, storyChapterSchema } from "@/lib/validations/cms/story";
import { reorderSchema } from "@/lib/validations/cms/settings";
import type { ActionState } from "@/lib/validations/admin/actionState";
import type { StoryPlaceRole } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

async function saveChapter(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.storyChapter.findUnique({ where: { id }, select: { id: true, sortOrder: true, status: true } }) : null;
  if (id && !existing) return failed("Capítulo não encontrado.");

  const parsed = storyChapterSchema.safeParse({
    periodLabelPt: text(formData, "periodLabelPt"),
    periodLabelEn: text(formData, "periodLabelEn"),
    axisLabel: text(formData, "axisLabel"),
    ghostLabelPt: text(formData, "ghostLabelPt"),
    ghostLabelEn: text(formData, "ghostLabelEn"),
    conceptPt: text(formData, "conceptPt"),
    conceptEn: text(formData, "conceptEn"),
    titlePt: text(formData, "titlePt"),
    titleEn: text(formData, "titleEn"),
    placeLabelPt: text(formData, "placeLabelPt"),
    placeLabelEn: text(formData, "placeLabelEn"),
    textPt: text(formData, "textPt"),
    textEn: text(formData, "textEn"),
    pullQuotePt: text(formData, "pullQuotePt"),
    pullQuoteEn: text(formData, "pullQuoteEn"),
    visualType: text(formData, "visualType"),
    imageId: text(formData, "imageId"),
    allowPhoto: bool(formData, "allowPhoto"),
    showRings: bool(formData, "showRings"),
    startsGlobalAct: bool(formData, "startsGlobalAct"),
    scrollWeight: text(formData, "scrollWeight"),
    status: bool(formData, "published") ? "PUBLISHED" : "DRAFT",
    places: {
      cameraPlaceIds: all(formData, "cameraPlaceIds"),
      labelPlaceIds: all(formData, "labelPlaceIds"),
      pulsePlaceId: text(formData, "pulsePlaceId") || null,
      routeFromPlaceId: text(formData, "routeFromPlaceId") || null,
      routeToPlaceId: text(formData, "routeToPlaceId") || null,
    },
  });
  if (!parsed.success) return invalid(parsed.error);
  const { places, ...chapter } = parsed.data;

  const bad = await findInvalidMedia({ imageId: { id: chapter.imageId, kind: "IMAGE" } });
  if (bad) return { ok: false, error: "Escolha uma imagem válida.", fieldErrors: { imageId: ["Imagem inválida."] } };

  // Cross-row rules that need the database.
  const referenced = [...new Set([...places.cameraPlaceIds, ...places.labelPlaceIds, places.pulsePlaceId, places.routeFromPlaceId, places.routeToPlaceId].filter(Boolean) as string[])];
  const placeRows = await prisma.place.findMany({ where: { id: { in: referenced } }, select: { id: true, cameraWidthDeg: true, namePt: true } });
  if (placeRows.length !== referenced.length) return failed("Um dos lugares escolhidos não existe mais — recarregue a página.");
  const noFrame = places.cameraPlaceIds.map((pid) => placeRows.find((p) => p.id === pid)!).find((p) => p.cameraWidthDeg === null);
  if (noFrame) {
    return { ok: false, error: `“${noFrame.namePt}” não tem largura de enquadramento — defina-a em Lugares para usá-lo como câmera.`, fieldErrors: { "places.cameraPlaceIds": ["Lugar sem enquadramento."] } };
  }
  if (chapter.status === "PUBLISHED" && existing?.status !== "PUBLISHED") {
    const published = await prisma.storyChapter.count({ where: { status: "PUBLISHED" } });
    if (published >= STORY_LIMITS.maxPublishedChapters) return failed(`Limite de ${STORY_LIMITS.maxPublishedChapters} capítulos publicados atingido.`);
  }

  const links: { placeId: string; role: StoryPlaceRole; sortOrder: number }[] = [
    ...places.cameraPlaceIds.map((placeId, i) => ({ placeId, role: "CAMERA" as const, sortOrder: i })),
    ...places.labelPlaceIds.map((placeId, i) => ({ placeId, role: "LABEL" as const, sortOrder: i })),
    ...(places.pulsePlaceId ? [{ placeId: places.pulsePlaceId, role: "PULSE" as const, sortOrder: 0 }] : []),
    ...(places.routeFromPlaceId ? [{ placeId: places.routeFromPlaceId, role: "ROUTE_FROM" as const, sortOrder: 0 }] : []),
    ...(places.routeToPlaceId ? [{ placeId: places.routeToPlaceId, role: "ROUTE_TO" as const, sortOrder: 0 }] : []),
  ];
  // A repeated camera frame (A → B → A) is fine visually but violates the unique link; keep the first occurrence.
  const uniqueLinks = links.filter((l, i) => links.findIndex((o) => o.placeId === l.placeId && o.role === l.role) === i);

  const sortOrder = existing?.sortOrder ?? ((await prisma.storyChapter.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;

  const row = await prisma.$transaction(async (tx) => {
    // Only one chapter may start the global act.
    if (chapter.startsGlobalAct) await tx.storyChapter.updateMany({ where: { startsGlobalAct: true, ...(id && { id: { not: id } }) }, data: { startsGlobalAct: false } });
    const result = id
      ? await tx.storyChapter.update({ where: { id }, data: { ...chapter, sortOrder } })
      : await tx.storyChapter.create({ data: { ...chapter, sortOrder } });
    await tx.storyChapterPlace.deleteMany({ where: { chapterId: result.id } });
    if (uniqueLinks.length) await tx.storyChapterPlace.createMany({ data: uniqueLinks.map((l) => ({ ...l, chapterId: result.id })) });
    return result;
  });

  await audit({ userId: user.id, action: id ? "update" : "create", entity: "StoryChapter", entityId: row.id, summary: `Capítulo: ${row.titlePt}`, diff: { ...chapter, places: uniqueLinks } });
  invalidate(CACHE_TAGS.story);
  redirect("/admin/story");
}

export async function createChapterAction(_prev: ActionState, formData: FormData) {
  return saveChapter(null, formData);
}

export async function updateChapterAction(id: string, _prev: ActionState, formData: FormData) {
  return saveChapter(id, formData);
}

export async function deleteChapterAction(id: string): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const row = await prisma.storyChapter.findUnique({ where: { id }, select: { titlePt: true } });
  if (!row) return saved();
  // StoryChapterPlace rows cascade with the chapter; places themselves are untouched.
  await prisma.storyChapter.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "StoryChapter", entityId: id, summary: `Capítulo excluído: ${row.titlePt}` });
  invalidate(CACHE_TAGS.story);
  return saved();
}

export async function reorderChaptersAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const total = await prisma.storyChapter.count();
  const matching = await prisma.storyChapter.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== total) return failed("A lista mudou em outra aba — recarregue a página.");

  await prisma.$transaction(parsed.data.map((id, index) => prisma.storyChapter.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "StoryChapter", summary: "Ordem dos capítulos", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.story);
  return saved();
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

async function savePlace(id: string | null, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const existing = id ? await prisma.place.findUnique({ where: { id }, select: { id: true, sortOrder: true } }) : null;
  if (id && !existing) return failed("Lugar não encontrado.");

  const parsed = placeSchema.safeParse({
    namePt: text(formData, "namePt"),
    nameEn: text(formData, "nameEn"),
    latitude: text(formData, "latitude"),
    longitude: text(formData, "longitude"),
    labelPosition: text(formData, "labelPosition"),
    cameraWidthDeg: text(formData, "cameraWidthDeg"),
    isOrigin: bool(formData, "isOrigin"),
    showOnGlobe: bool(formData, "showOnGlobe"),
    globeOrder: text(formData, "globeOrder"),
    sortOrder: existing?.sortOrder ?? 0,
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // A place used as a camera frame can't lose its framing width.
  if (id && data.cameraWidthDeg === null) {
    const asCamera = await prisma.storyChapterPlace.count({ where: { placeId: id, role: "CAMERA" } });
    if (asCamera > 0) return { ok: false, error: "Este lugar é enquadramento de câmera em capítulos — a largura é obrigatória.", fieldErrors: { cameraWidthDeg: ["Obrigatório enquanto usado como câmera."] } };
  }

  const sortOrder = existing?.sortOrder ?? ((await prisma.place.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const row = await prisma.$transaction(async (tx) => {
    // Only one origin.
    if (data.isOrigin) await tx.place.updateMany({ where: { isOrigin: true, ...(id && { id: { not: id } }) }, data: { isOrigin: false } });
    return id ? tx.place.update({ where: { id }, data: { ...data, sortOrder } }) : tx.place.create({ data: { ...data, sortOrder } });
  });

  await audit({ userId: user.id, action: id ? "update" : "create", entity: "Place", entityId: row.id, summary: `Lugar: ${row.namePt}`, diff: data });
  invalidate(CACHE_TAGS.places, CACHE_TAGS.story);
  redirect("/admin/places");
}

export async function createPlaceAction(_prev: ActionState, formData: FormData) {
  return savePlace(null, formData);
}

export async function updatePlaceAction(id: string, _prev: ActionState, formData: FormData) {
  return savePlace(id, formData);
}

/** Blocked while any chapter references the place (the FK is Restrict — this gives a readable reason first). */
export async function deletePlaceAction(id: string): Promise<{ ok: boolean; error?: string; usedIn?: string[] }> {
  const user = await requireRole(CONTENT_ROLES);
  const place = await prisma.place.findUnique({
    where: { id },
    select: { namePt: true, chapterLinks: { select: { chapter: { select: { titlePt: true } } } } },
  });
  if (!place) return { ok: true };
  if (place.chapterLinks.length > 0) {
    const chapters = [...new Set(place.chapterLinks.map((l) => l.chapter.titlePt))];
    return { ok: false, error: "Este lugar está em uso em capítulos da História e não pode ser excluído.", usedIn: chapters };
  }
  await prisma.place.delete({ where: { id } });
  await audit({ userId: user.id, action: "delete", entity: "Place", entityId: id, summary: `Lugar excluído: ${place.namePt}` });
  invalidate(CACHE_TAGS.places, CACHE_TAGS.story);
  return { ok: true };
}

export async function reorderPlacesAction(ids: string[]): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return failed("Ordem inválida.");
  const matching = await prisma.place.count({ where: { id: { in: parsed.data } } });
  if (matching !== parsed.data.length || matching !== (await prisma.place.count())) return failed("A lista mudou em outra aba — recarregue a página.");

  await prisma.$transaction(parsed.data.map((id, index) => prisma.place.update({ where: { id }, data: { sortOrder: index } })));
  await audit({ userId: user.id, action: "reorder", entity: "Place", summary: "Ordem dos lugares", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.places);
  return saved();
}

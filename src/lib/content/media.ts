import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export interface MediaUsage {
  inUseCount: number;
  usedIn: string[]; // human-readable labels, e.g. "Hero — imagem de fundo"
}

/**
 * Every Media back-relation, with its admin label. Typed against
 * Prisma.MediaCountOutputType: adding a Media FK to the schema without a
 * label here is a TypeScript error, so the usage check (and therefore safe
 * deletion) can never silently under-report.
 */
const USAGE_LABELS: Record<keyof Prisma.MediaCountOutputType, string> = {
  brandPrimaryLogos: "Marca — logo principal",
  brandSecondaryLogos: "Marca — logo alternativa",
  brandLightLogos: "Marca — logo clara",
  brandDarkLogos: "Marca — logo escura",
  brandIcons: "Marca — ícone",
  brandFavicons: "Marca — favicon",
  seoOgImages: "SEO — imagem de compartilhamento",
  heroBackgrounds: "Hero — imagem de fundo",
  heroVideos: "Hero — vídeo",
  heroPosters: "Hero — poster do vídeo",
  statementBgs: "Statement — fundo",
  narrativeBgs: "Transição narrativa — fundo",
  pressKitOneSheets: "Press Kit — one-sheet",
  pressKitPhotoPacks: "Press Kit — fotos",
  pressKitLogoPacks: "Press Kit — logos",
  storyChapterImages: "História — capítulo",
  worldStageImages: "World Stages — imagem",
  worldStageVideos: "World Stages — vídeo",
  experienceFrames: "Experience",
  releaseCovers: "Música — capa",
  galleryItems: "Galeria",
  pressLogos: "Imprensa — logo do veículo",
  showImages: "Agenda — show",
};

const COUNT_SELECT = Object.fromEntries(Object.keys(USAGE_LABELS).map((key) => [key, true])) as Record<
  keyof Prisma.MediaCountOutputType,
  true
>;

/** Checks every place a Media row can be referenced before allowing a delete. */
export async function getMediaUsage(mediaId: string): Promise<MediaUsage> {
  const row = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { _count: { select: COUNT_SELECT } },
  });

  if (!row) return { inUseCount: 0, usedIn: [] };

  const usedIn: string[] = [];
  let inUseCount = 0;
  for (const [key, count] of Object.entries(row._count) as [keyof Prisma.MediaCountOutputType, number][]) {
    if (count > 0) {
      inUseCount += count;
      usedIn.push(USAGE_LABELS[key]);
    }
  }

  return { inUseCount, usedIn };
}

import "server-only";
import { prisma } from "@/lib/db";

export interface MediaUsage {
  inUseCount: number;
  usedIn: string[]; // human-readable labels, e.g. "Hero (Página inicial)"
}

/**
 * Checks every place a Media row can be referenced before allowing a delete.
 * Whenever a new model gets a Media foreign key, add it to both the Prisma
 * `_count.select` below and the matching label — otherwise this silently
 * under-reports and a delete could orphan a live reference.
 */
export async function getMediaUsage(mediaId: string): Promise<MediaUsage> {
  const row = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      _count: {
        select: {
          heroBackgrounds: true,
          heroVideos: true,
          heroPosters: true,
          narrativeBgs: true,
          statementBgs: true,
          timelineEvents: true,
          worldStageImages: true,
          worldStageVideos: true,
          experienceFrames: true,
          releaseCovers: true,
          galleryItems: true,
          pressLogos: true,
          pressKitOneSheets: true,
          pressKitPhotoPacks: true,
          pressKitLogoPacks: true,
          seoOgImages: true,
          showImages: true,
        },
      },
    },
  });

  if (!row) return { inUseCount: 0, usedIn: [] };

  const LABELS: Record<string, string> = {
    heroBackgrounds: "Hero (Página inicial)",
    heroVideos: "Hero — vídeo (Página inicial)",
    heroPosters: "Hero — poster (Página inicial)",
    narrativeBgs: "Transição narrativa",
    statementBgs: "Statement — fundo (Página inicial)",
    timelineEvents: "Carreira — Linha do tempo",
    worldStageImages: "Carreira — Grandes Palcos",
    worldStageVideos: "Carreira — Grandes Palcos (vídeo)",
    experienceFrames: "The Experience",
    releaseCovers: "Música — Lançamentos",
    galleryItems: "Galeria",
    pressLogos: "Imprensa",
    pressKitOneSheets: "Press Kit — one-sheet",
    pressKitPhotoPacks: "Press Kit — fotos",
    pressKitLogoPacks: "Press Kit — logos",
    seoOgImages: "SEO — imagem de compartilhamento",
    showImages: "Agenda — Shows",
  };

  const usedIn: string[] = [];
  let inUseCount = 0;
  for (const [key, count] of Object.entries(row._count)) {
    if (count > 0) {
      inUseCount += count;
      usedIn.push(LABELS[key] ?? key);
    }
  }

  return { inUseCount, usedIn };
}

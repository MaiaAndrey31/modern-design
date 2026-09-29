import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadPlaceOptions, mediaValue } from "@/lib/admin/queries";
import { isStoryVisualType } from "@/lib/story/registry";
import { updateChapterAction } from "@/app/(admin)/admin/_actions/story";
import { AdminPage } from "@/components/admin/ui";
import { ChapterForm } from "../../ChapterForm";

export default async function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [chapter, places] = await Promise.all([
    prisma.storyChapter.findUnique({ where: { id }, include: { image: true, places: { orderBy: { sortOrder: "asc" } } } }),
    loadPlaceOptions(),
  ]);
  if (!chapter) notFound();
  const ids = (role: string) => chapter.places.filter((l) => l.role === role).map((l) => l.placeId);

  return (
    <AdminPage eyebrow="Conteúdo · História" title={`Editar: ${chapter.titlePt}`}>
      <ChapterForm
        action={updateChapterAction.bind(null, id)}
        places={places}
        initial={{
          periodLabelPt: chapter.periodLabelPt,
          periodLabelEn: chapter.periodLabelEn,
          axisLabel: chapter.axisLabel,
          ghostLabelPt: chapter.ghostLabelPt,
          ghostLabelEn: chapter.ghostLabelEn,
          conceptPt: chapter.conceptPt,
          conceptEn: chapter.conceptEn,
          titlePt: chapter.titlePt,
          titleEn: chapter.titleEn,
          placeLabelPt: chapter.placeLabelPt,
          placeLabelEn: chapter.placeLabelEn,
          textPt: chapter.textPt,
          textEn: chapter.textEn,
          pullQuotePt: chapter.pullQuotePt,
          pullQuoteEn: chapter.pullQuoteEn,
          visualType: isStoryVisualType(chapter.visualType) ? chapter.visualType : "map",
          image: mediaValue(chapter.image),
          allowPhoto: chapter.allowPhoto,
          showRings: chapter.showRings,
          startsGlobalAct: chapter.startsGlobalAct,
          scrollWeight: chapter.scrollWeight,
          published: chapter.status === "PUBLISHED",
          cameraPlaceIds: ids("CAMERA"),
          labelPlaceIds: ids("LABEL"),
          pulsePlaceId: ids("PULSE")[0] ?? null,
          routeFromPlaceId: ids("ROUTE_FROM")[0] ?? null,
          routeToPlaceId: ids("ROUTE_TO")[0] ?? null,
        }}
      />
    </AdminPage>
  );
}

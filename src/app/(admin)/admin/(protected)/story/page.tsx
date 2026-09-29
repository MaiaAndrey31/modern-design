import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { loadSection } from "@/lib/admin/queries";
import { STORY_LIMITS, STORY_VISUAL_LABELS, isStoryVisualType } from "@/lib/story/registry";
import { AdminPage, Card, EmptyState, PrimaryLink } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { StorySectionForm } from "./StorySectionForm";
import { ChapterList, type ChapterRow } from "./ChapterList";

export default async function StoryPage() {
  await requireSession();
  const [section, story, chapters] = await Promise.all([
    loadSection("story"),
    prisma.storySection.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.storyChapter.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true, _count: { select: { places: true } } } }),
  ]);
  const s = story ?? SYSTEM_DEFAULTS.story;
  const published = chapters.filter((c) => c.status === "PUBLISHED").length;

  const rows: ChapterRow[] = chapters.map((c) => ({
    id: c.id,
    period: c.periodLabelPt,
    title: c.titlePt,
    concept: c.conceptPt,
    visual: isStoryVisualType(c.visualType) ? STORY_VISUAL_LABELS[c.visualType] : c.visualType,
    imageUrl: c.image?.url ?? null,
    placeCount: c._count.places,
    startsGlobalAct: c.startsGlobalAct,
    missingEn: !c.titleEn || !c.textEn,
    status: c.status,
  }));

  return (
    <AdminPage
      eyebrow="Conteúdo"
      title="História"
      description="A narrativa em capítulos, com mapa e visuais. O código cuida da animação; aqui você edita os dados de cada capítulo."
    >
      <div className="grid gap-8 xl:grid-cols-2">
        <Card title="Título da seção">
          <SectionCopyForm sectionKey="story" values={section} />
        </Card>
        <Card title="Abertura e encerramento" description="Interlúdios antes do primeiro capítulo, na virada para o palco global e no fim.">
          <StorySectionForm
            initial={{
              introQuestionPt: s.introQuestionPt,
              introQuestionEn: s.introQuestionEn,
              thesisLinesPt: s.thesisLinesPt,
              thesisLinesEn: s.thesisLinesEn,
              outroLinesPt: s.outroLinesPt,
              outroLinesEn: s.outroLinesEn,
            }}
          />
        </Card>
      </div>

      <Card
        title={`Capítulos (${published}/${STORY_LIMITS.maxPublishedChapters} publicados)`}
        description={
          <>
            Arraste para reordenar. Os lugares do mapa são cadastrados em{" "}
            <Link href="/admin/places" className="underline">
              Lugares
            </Link>
            .
          </>
        }
      >
        <div className="flex justify-end">
          <PrimaryLink href="/admin/story/chapters/new">+ Novo capítulo</PrimaryLink>
        </div>
        {rows.length === 0 ? <EmptyState>Nenhum capítulo. Sem capítulos publicados, a seção História não aparece no site.</EmptyState> : <ChapterList rows={rows} />}
      </Card>
    </AdminPage>
  );
}

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadSection } from "@/lib/admin/queries";
import { AdminPage, Card, EmptyState, PrimaryLink } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { StageList, type StageRow } from "./StageList";

export default async function WorldStagesPage() {
  await requireSession();
  const [section, stages] = await Promise.all([
    loadSection("worldStages"),
    prisma.worldStage.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true } }),
  ]);
  const rows: StageRow[] = stages.map((s) => ({
    id: s.id,
    year: s.yearLabel,
    title: s.titlePt,
    location: s.locationPt,
    imageUrl: s.image?.url ?? null,
    showInNumbers: s.showInNumbers,
    missingEn: !s.titleEn || !s.descriptionEn,
    status: s.status,
  }));

  return (
    <AdminPage
      eyebrow="Conteúdo"
      title="World Stages"
      description="Grandes palcos em painéis de tela cheia com scroll horizontal (até 8 publicados)."
      actions={<PrimaryLink href="/admin/world-stages/new">+ Novo palco</PrimaryLink>}
    >
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="worldStages" values={section} />
      </Card>
      <Card title="Palcos">{rows.length === 0 ? <EmptyState>Nenhum palco cadastrado.</EmptyState> : <StageList rows={rows} />}</Card>
    </AdminPage>
  );
}

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadSection } from "@/lib/admin/queries";
import { AdminPage, Card, EmptyState, PrimaryLink } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { CollectionList, type CollectionRow } from "@/components/admin/CollectionList";
import { deletePressItemAction, reorderPressItemsAction } from "@/app/(admin)/admin/_actions/press";

export default async function PressPage() {
  await requireSession();
  const [section, items] = await Promise.all([
    loadSection("press"),
    prisma.pressItem.findMany({ orderBy: { sortOrder: "asc" }, include: { logo: true } }),
  ]);
  const rows: CollectionRow[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    meta: `${i.outlet} · ${i.dateLabel}${i.excerptPt && !i.excerptEn ? " · EN incompleto" : ""}`,
    imageUrl: i.logo?.url ?? null,
    status: i.status,
    editHref: `/admin/press/${i.id}/edit`,
  }));

  return (
    <AdminPage eyebrow="Conteúdo" title="Imprensa" actions={<PrimaryLink href="/admin/press/new">+ Nova matéria</PrimaryLink>}>
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="press" values={section} />
      </Card>
      <Card title="Matérias">
        {rows.length === 0 ? (
          <EmptyState>Nenhuma matéria. O site mostra o texto “sem matérias” da seção.</EmptyState>
        ) : (
          <CollectionList label="Matérias" rows={rows} reorder={reorderPressItemsAction} remove={deletePressItemAction} />
        )}
      </Card>
    </AdminPage>
  );
}

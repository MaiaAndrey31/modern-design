import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadSection } from "@/lib/admin/queries";
import { AdminPage, Card, EmptyState, Notice, PrimaryLink } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { CollectionList, type CollectionRow } from "@/components/admin/CollectionList";
import { deleteReleaseAction, reorderReleasesAction } from "@/app/(admin)/admin/_actions/releases";

export default async function ReleasesPage() {
  await requireSession();
  const [section, releases] = await Promise.all([
    loadSection("music"),
    prisma.release.findMany({ orderBy: { sortOrder: "asc" }, include: { cover: true } }),
  ]);
  const rows: CollectionRow[] = releases.map((r) => ({
    id: r.id,
    title: r.title,
    meta: `${r.yearLabel} · ${r.type}`,
    imageUrl: r.cover?.url ?? null,
    status: r.status,
    editHref: `/admin/releases/${r.id}/edit`,
  }));

  return (
    <AdminPage eyebrow="Conteúdo" title="Música" actions={<PrimaryLink href="/admin/releases/new">+ Novo lançamento</PrimaryLink>}>
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="music" values={section} />
      </Card>
      <Notice>
        Os botões de streaming da seção vêm das redes marcadas como “Música” em{" "}
        <Link href="/admin/social" className="underline">
          Redes sociais
        </Link>
        .
      </Notice>
      <Card title="Lançamentos">
        {rows.length === 0 ? (
          <EmptyState>Nenhum lançamento. O site mostra o texto “sem lançamentos” da seção.</EmptyState>
        ) : (
          <CollectionList label="Lançamentos" rows={rows} reorder={reorderReleasesAction} remove={deleteReleaseAction} />
        )}
      </Card>
    </AdminPage>
  );
}

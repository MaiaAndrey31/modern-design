import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadSection } from "@/lib/admin/queries";
import { AdminPage, Card } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { GalleryGrid } from "./GalleryGrid";

export default async function GalleryAdminPage() {
  await requireSession();
  const [section, rows] = await Promise.all([
    loadSection("gallery"),
    prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" }, include: { media: true } }),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    url: row.media.url,
    alt: row.altPt,
    altEn: row.altEn,
    caption: row.captionPt,
    captionEn: row.captionEn,
    status: row.status,
  }));

  return (
    <AdminPage eyebrow="Conteúdo" title="Galeria" description="Arraste para reordenar. A ordem reflete automaticamente no site. Sem fotos publicadas, a seção não aparece.">
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="gallery" values={section} />
      </Card>
      <Card title="Fotos">
        <GalleryGrid initialItems={items} />
      </Card>
    </AdminPage>
  );
}

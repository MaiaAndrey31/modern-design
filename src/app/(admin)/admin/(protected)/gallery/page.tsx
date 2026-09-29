import { prisma } from "@/lib/db";
import { GalleryGrid } from "./GalleryGrid";

export default async function GalleryAdminPage() {
  const rows = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });

  const items = rows.map((row) => ({
    id: row.id,
    url: row.media.url,
    alt: row.alt,
    caption: row.caption,
    status: row.status,
  }));

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Galeria</h1>
      <p className="mt-1 text-sm text-neutral-500">Arraste para reordenar. A ordem reflete automaticamente no site.</p>
      <div className="mt-6">
        <GalleryGrid initialItems={items} />
      </div>
    </div>
  );
}

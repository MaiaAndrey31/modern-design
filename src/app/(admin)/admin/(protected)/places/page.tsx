import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { AdminPage, EmptyState, Notice, PrimaryLink } from "@/components/admin/ui";
import { PlaceList, type PlaceRow } from "./PlaceList";

export default async function PlacesPage() {
  await requireSession();
  const places = await prisma.place.findMany({
    orderBy: [{ sortOrder: "asc" }, { namePt: "asc" }],
    include: { _count: { select: { chapterLinks: true } } },
  });
  const rows: PlaceRow[] = places.map((p) => ({
    id: p.id,
    name: p.namePt,
    nameEn: p.nameEn,
    coords: `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
    frame: p.cameraWidthDeg !== null ? `${p.cameraWidthDeg}°` : null,
    isOrigin: p.isOrigin,
    globe: p.showOnGlobe ? (p.globeOrder !== null ? `globo #${p.globeOrder}` : "globo") : null,
    usage: p._count.chapterLinks,
  }));

  return (
    <AdminPage
      eyebrow="Conteúdo"
      title="Lugares"
      description="Pontos geográficos usados pelo mapa da História e pelo globo do Statement."
      actions={<PrimaryLink href="/admin/places/new">+ Novo lugar</PrimaryLink>}
    >
      <Notice>
        Um lugar com <strong>largura de enquadramento</strong> pode ser usado como câmera do mapa (ex.: um país inteiro ≈ 46°, um estado ≈ 15°, uma cidade ≈ 5°). A
        <strong> origem</strong> é o ponto de partida das rotas do globo.
      </Notice>
      {rows.length === 0 ? <EmptyState>Nenhum lugar cadastrado.</EmptyState> : <PlaceList rows={rows} />}
    </AdminPage>
  );
}

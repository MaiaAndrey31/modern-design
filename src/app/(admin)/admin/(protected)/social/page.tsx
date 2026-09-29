import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { getSocialPlatform } from "@/lib/social/registry";
import { AdminPage, EmptyState, PrimaryLink } from "@/components/admin/ui";
import { SocialList, type SocialRow } from "./SocialList";

export default async function SocialPage() {
  await requireSession();
  const rows = await prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } });
  const items: SocialRow[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    platform: getSocialPlatform(r.platform).label,
    url: r.url,
    enabled: r.enabled,
    placements: [r.showInHeader && "Header", r.showInFooter && "Footer", r.showInMusic && "Música"].filter(Boolean).join(" · ") || "Nenhum local",
  }));

  return (
    <AdminPage
      eyebrow="Navegação"
      title="Redes sociais"
      description="Perfis e plataformas de streaming. Cada link escolhe onde aparece: header, footer e/ou seção de música."
      actions={<PrimaryLink href="/admin/social/new">+ Nova rede</PrimaryLink>}
    >
      {items.length === 0 ? <EmptyState>Nenhuma rede cadastrada — sem redes, nenhum ícone aparece no site.</EmptyState> : <SocialList items={items} />}
    </AdminPage>
  );
}

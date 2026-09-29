import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { NAVIGATION_LOCATIONS, NAVIGATION_LOCATION_LABELS, NAVIGATION_ITEM_TYPE_LABELS } from "@/lib/navigation/registry";
import { SECTION_REGISTRY, isSectionKey } from "@/lib/sections/registry";
import { AdminPage, Card, PrimaryLink } from "@/components/admin/ui";
import { MenuGroup, type MenuRow } from "./MenuGroup";

function describeTarget(type: "SECTION" | "ROUTE" | "EXTERNAL", target: string) {
  if (type === "SECTION") return isSectionKey(target) ? `Seção: ${SECTION_REGISTRY[target].label}` : `Seção desconhecida (${target})`;
  return `${NAVIGATION_ITEM_TYPE_LABELS[type]}: ${target}`;
}

export default async function MenusPage() {
  await requirePageRole(SETTINGS_ROLES);
  const items = await prisma.navigationItem.findMany({ orderBy: [{ location: "asc" }, { sortOrder: "asc" }] });

  return (
    <AdminPage
      eyebrow="Navegação"
      title="Menus"
      description="Links do header (e menu mobile) e dos grupos do footer. Links para seções desativadas ou vazias somem automaticamente do site."
      actions={<PrimaryLink href="/admin/menus/new">+ Novo link</PrimaryLink>}
    >
      {NAVIGATION_LOCATIONS.map((location) => {
        const rows: MenuRow[] = items
          .filter((i) => i.location === location)
          .map((i) => ({
            id: i.id,
            label: i.labelPt,
            labelEn: i.labelEn,
            target: describeTarget(i.type, i.target),
            enabled: i.enabled,
            openInNewTab: i.openInNewTab,
          }));
        return (
          <Card key={location} title={NAVIGATION_LOCATION_LABELS[location]}>
            <MenuGroup location={location} rows={rows} />
          </Card>
        );
      })}
    </AdminPage>
  );
}

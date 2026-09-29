import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SECTION_KEYS, SECTION_REGISTRY } from "@/lib/sections/registry";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { SECTION_ADMIN_ROUTES } from "@/lib/admin/nav";
import { AdminPage, Notice } from "@/components/admin/ui";
import { SectionsManager, type SectionRow } from "./SectionsManager";

export default async function SectionsPage() {
  await requirePageRole(SETTINGS_ROLES);
  const rows = await prisma.section.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const sections: SectionRow[] = SECTION_KEYS.map((key) => {
    const row = byKey.get(key);
    const defaults = SYSTEM_DEFAULTS.sections[key];
    return {
      id: key,
      label: SECTION_REGISTRY[key].label,
      enabled: row?.enabled ?? defaults.enabled,
      sortOrder: row?.sortOrder ?? defaults.sortOrder,
      fixed: SECTION_REGISTRY[key].position === "first",
      toggleable: SECTION_REGISTRY[key].toggleable,
      editHref: SECTION_ADMIN_ROUTES[key],
    };
  });

  const hero = sections.filter((s) => s.fixed);
  const flow = sections.filter((s) => !s.fixed).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AdminPage
      eyebrow="Conteúdo"
      title="Seções"
      description="Quais seções aparecem no site e em que ordem. O Hero é sempre a primeira e o Footer é sempre o último."
    >
      <Notice>
        A ordem é salva agora; a página pública passa a respeitá-la quando o renderizador dinâmico for concluído (Fase 5). A visibilidade
        (ativar/desativar) já vale no site.
      </Notice>
      <SectionsManager fixed={hero} flow={flow} />
    </AdminPage>
  );
}

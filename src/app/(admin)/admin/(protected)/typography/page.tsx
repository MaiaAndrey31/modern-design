import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { isFontId } from "@/lib/fonts/registry";
import { AdminPage, Notice } from "@/components/admin/ui";
import { TypographyForm } from "./TypographyForm";

export default async function TypographyPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = await prisma.typographySettings.findUnique({ where: { id: SINGLETON_ID } });
  const d = SYSTEM_DEFAULTS.typography;
  // An id no longer in the registry falls back to the role default (same rule as the site).
  const font = (value: string | undefined, fallback: string) => (value && isFontId(value) ? value : fallback);

  return (
    <AdminPage
      eyebrow="Aparência"
      title="Tipografia"
      description="Fontes do site por papel. A mesma fonte pode ser usada em mais de um papel; o site carrega somente as fontes escolhidas."
    >
      <Notice>
        Novas fontes são adicionadas pelo time técnico no registro de fontes (<code>src/lib/fonts/registry.ts</code>) — sem migration.
      </Notice>
      <TypographyForm
        initial={{
          displayFontId: font(row?.displayFontId, d.displayFontId),
          headingFontId: font(row?.headingFontId, d.headingFontId),
          bodyFontId: font(row?.bodyFontId, d.bodyFontId),
          displayWeight: row?.displayWeight ?? d.displayWeight,
          headingWeight: row?.headingWeight ?? d.headingWeight,
          bodyWeight: row?.bodyWeight ?? d.bodyWeight,
          displayTracking: row?.displayTracking ?? d.displayTracking,
          headingTracking: row?.headingTracking ?? d.headingTracking,
          typeScale: row?.typeScale ?? d.typeScale,
        }}
      />
    </AdminPage>
  );
}

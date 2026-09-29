import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { THEME_COLOR_TOKENS, HEX_COLOR_PATTERN } from "@/lib/theme/registry";
import { AdminPage } from "@/components/admin/ui";
import { ColorsForm, type ThemeValues } from "./ColorsForm";

export default async function ColorsPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = await prisma.themeSettings.findUnique({ where: { id: SINGLETON_ID } });
  const initial: ThemeValues = { ...SYSTEM_DEFAULTS.theme };
  if (row) {
    for (const { key } of THEME_COLOR_TOKENS) if (HEX_COLOR_PATTERN.test(row[key])) initial[key] = row[key].toUpperCase();
    initial.buttonRadius = row.buttonRadius;
    initial.cardRadius = row.cardRadius;
  }

  return (
    <AdminPage
      eyebrow="Aparência"
      title="Cores"
      description="Tokens de cor do site. Tons mais claros/escuros e transparências são derivados automaticamente — não é preciso cadastrá-los."
    >
      <ColorsForm initial={initial} defaults={{ ...SYSTEM_DEFAULTS.theme }} />
    </AdminPage>
  );
}

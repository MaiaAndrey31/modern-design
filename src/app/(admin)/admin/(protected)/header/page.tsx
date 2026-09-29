import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { isLogoVariant } from "@/lib/navigation/registry";
import { AdminPage, Notice } from "@/components/admin/ui";
import { HeaderForm } from "./HeaderForm";

export default async function HeaderPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = (await prisma.headerSettings.findUnique({ where: { id: SINGLETON_ID } })) ?? SYSTEM_DEFAULTS.header;

  return (
    <AdminPage eyebrow="Navegação" title="Header" description="Logo, seletor de idioma, redes sociais e botão de destaque do topo do site.">
      <Notice>
        Os links do menu são editados em{" "}
        <Link href="/admin/menus" className="underline">
          Menus
        </Link>{" "}
        (grupo Header).
      </Notice>
      <HeaderForm
        initial={{
          logoVariant: isLogoVariant(row.logoVariant) ? row.logoVariant : "primary",
          showLanguageSwitch: row.showLanguageSwitch,
          showSocials: row.showSocials,
          showCta: row.showCta,
          ctaLabelPt: row.ctaLabelPt,
          ctaLabelEn: row.ctaLabelEn,
          ctaType: row.ctaType,
          ctaTarget: row.ctaTarget,
        }}
      />
    </AdminPage>
  );
}

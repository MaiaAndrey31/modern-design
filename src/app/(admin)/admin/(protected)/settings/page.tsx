import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { getEnvSiteUrl } from "@/lib/siteUrl";
import { AdminPage } from "@/components/admin/ui";
import { SiteSettingsForm } from "./SiteSettingsForm";

export default async function SiteSettingsPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = (await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } })) ?? SYSTEM_DEFAULTS.site;

  return (
    <AdminPage eyebrow="Configurações" title="Site" description="Endereço público, idioma padrão e dados de contato. A identidade visual fica em Aparência.">
      <SiteSettingsForm
        envSiteUrl={getEnvSiteUrl()}
        initial={{
          siteUrl: row.siteUrl ?? "",
          defaultLocale: row.defaultLocale === "en" ? "en" : "pt",
          contactEmail: row.contactEmail ?? "",
          contactPhone: row.contactPhone ?? "",
          whatsappNumber: row.whatsappNumber ?? "",
        }}
      />
    </AdminPage>
  );
}

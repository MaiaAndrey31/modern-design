import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { getEnvSiteUrl, normalizeSiteUrl } from "@/lib/siteUrl";
import { mediaValue } from "@/lib/admin/queries";
import { AdminPage } from "@/components/admin/ui";
import { SeoForm } from "./SeoForm";

export default async function SeoAdminPage() {
  await requirePageRole(SETTINGS_ROLES);
  const [seo, brand, site] = await Promise.all([
    prisma.seoSettings.findUnique({ where: { id: SINGLETON_ID }, include: { ogImage: true } }),
    prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } }),
  ]);
  const b = brand ?? SYSTEM_DEFAULTS.brand;

  return (
    <AdminPage eyebrow="Configurações" title="SEO" description="Título, descrição e imagem usados pelo Google e ao compartilhar o link do site.">
      <SeoForm
        initialValues={{
          metaTitlePt: seo?.metaTitlePt ?? "",
          metaTitleEn: seo?.metaTitleEn ?? "",
          metaDescriptionPt: seo?.metaDescriptionPt ?? "",
          metaDescriptionEn: seo?.metaDescriptionEn ?? "",
          twitterHandle: seo?.twitterHandle ?? "",
          robotsIndex: seo?.robotsIndex ?? true,
          ogImage: mediaValue(seo?.ogImage),
          // Same fallbacks as the site's getSeo().
          fallbackTitle: `${b.brandName} — ${b.taglinePt}`,
          fallbackDescription: b.descriptionPt,
          siteUrl: normalizeSiteUrl(site?.siteUrl) ?? getEnvSiteUrl(),
        }}
      />
    </AdminPage>
  );
}

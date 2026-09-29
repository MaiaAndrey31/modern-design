import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { mediaValue } from "@/lib/admin/queries";
import { AdminPage } from "@/components/admin/ui";
import { BrandForm } from "./BrandForm";

export default async function BrandPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = await prisma.brandSettings.findUnique({
    where: { id: SINGLETON_ID },
    include: { primaryLogo: true, secondaryLogo: true, lightLogo: true, darkLogo: true, icon: true, favicon: true },
  });
  const d = SYSTEM_DEFAULTS.brand;

  return (
    <AdminPage
      eyebrow="Aparência"
      title="Marca"
      description="Identidade universal do site: nome, tagline, logos e favicon. Funções, bio e origem ficam em Conteúdo → Perfil."
    >
      <BrandForm
        initial={{
          brandName: row?.brandName ?? d.brandName,
          shortName: row?.shortName ?? d.shortName,
          monogram: row?.monogram ?? d.monogram,
          taglinePt: row?.taglinePt ?? d.taglinePt,
          taglineEn: row?.taglineEn ?? d.taglineEn,
          descriptionPt: row?.descriptionPt ?? d.descriptionPt,
          descriptionEn: row?.descriptionEn ?? d.descriptionEn,
          logos: {
            primaryLogoId: mediaValue(row?.primaryLogo),
            secondaryLogoId: mediaValue(row?.secondaryLogo),
            lightLogoId: mediaValue(row?.lightLogo),
            darkLogoId: mediaValue(row?.darkLogo),
            iconId: mediaValue(row?.icon),
            faviconId: mediaValue(row?.favicon),
          },
        }}
      />
    </AdminPage>
  );
}

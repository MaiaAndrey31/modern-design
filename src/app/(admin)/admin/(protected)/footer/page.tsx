import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { isLogoVariant } from "@/lib/navigation/registry";
import { AdminPage, Notice } from "@/components/admin/ui";
import { FooterForm } from "./FooterForm";

export default async function FooterPage() {
  await requirePageRole(SETTINGS_ROLES);
  const row = (await prisma.footerSettings.findUnique({ where: { id: SINGLETON_ID } })) ?? SYSTEM_DEFAULTS.footer;

  return (
    <AdminPage eyebrow="Navegação" title="Footer" description="Rodapé do site. Sempre aparece no fim da página.">
      <Notice>
        Os links vêm de{" "}
        <Link href="/admin/menus" className="underline">
          Menus
        </Link>{" "}
        (grupos Footer), o contato de{" "}
        <Link href="/admin/settings" className="underline">
          Configurações → Site
        </Link>{" "}
        e as redes de{" "}
        <Link href="/admin/social" className="underline">
          Redes sociais
        </Link>
        .
      </Notice>
      <FooterForm
        initial={{
          logoVariant: isLogoVariant(row.logoVariant) ? row.logoVariant : "primary",
          showWordmark: row.showWordmark,
          descriptionPt: row.descriptionPt,
          descriptionEn: row.descriptionEn,
          copyrightPt: row.copyrightPt,
          copyrightEn: row.copyrightEn,
          backToTopLabelPt: row.backToTopLabelPt,
          backToTopLabelEn: row.backToTopLabelEn,
          showBookingCta: row.showBookingCta,
          bookingLabelPt: row.bookingLabelPt,
          bookingLabelEn: row.bookingLabelEn,
          bookingType: row.bookingType,
          bookingTarget: row.bookingTarget,
          showSocials: row.showSocials,
          showContact: row.showContact,
        }}
      />
    </AdminPage>
  );
}

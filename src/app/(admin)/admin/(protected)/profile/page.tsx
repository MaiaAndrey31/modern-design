import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { AdminPage } from "@/components/admin/ui";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  await requireSession();
  const row = (await prisma.profile.findUnique({ where: { id: SINGLETON_ID } })) ?? SYSTEM_DEFAULTS.profile;

  return (
    <AdminPage
      eyebrow="Conteúdo"
      title="Perfil"
      description="Quem o site apresenta: funções, biografia, origem e ano de início. Alimenta o Hero, Números, Música, Press Kit e o footer."
    >
      <ProfileForm
        initial={{
          rolesPt: row.rolesPt,
          rolesEn: row.rolesEn,
          bioPt: row.bioPt,
          bioEn: row.bioEn,
          originLabelPt: row.originLabelPt,
          originLabelEn: row.originLabelEn,
          foundedYear: row.foundedYear,
        }}
      />
    </AdminPage>
  );
}

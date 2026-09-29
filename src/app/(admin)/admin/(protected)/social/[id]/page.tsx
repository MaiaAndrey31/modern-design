import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { isSocialPlatformId } from "@/lib/social/registry";
import { updateSocialLinkAction } from "@/app/(admin)/admin/_actions/social";
import { AdminPage } from "@/components/admin/ui";
import { SocialForm } from "../SocialForm";

export default async function EditSocialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const row = await prisma.socialLink.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <AdminPage eyebrow="Navegação · Redes sociais" title="Editar rede">
      <SocialForm
        action={updateSocialLinkAction.bind(null, id)}
        initial={{
          platform: isSocialPlatformId(row.platform) ? row.platform : "custom",
          label: row.label,
          url: row.url,
          enabled: row.enabled,
          showInHeader: row.showInHeader,
          showInFooter: row.showInFooter,
          showInMusic: row.showInMusic,
        }}
      />
    </AdminPage>
  );
}

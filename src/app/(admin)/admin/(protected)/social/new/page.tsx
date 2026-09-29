import { requireSession } from "@/lib/auth/guards";
import { createSocialLinkAction } from "@/app/(admin)/admin/_actions/social";
import { AdminPage } from "@/components/admin/ui";
import { SocialForm } from "../SocialForm";

export default async function NewSocialPage() {
  await requireSession();
  return (
    <AdminPage eyebrow="Navegação · Redes sociais" title="Nova rede">
      <SocialForm
        action={createSocialLinkAction}
        initial={{ platform: "instagram", label: "Instagram", url: "", enabled: true, showInHeader: false, showInFooter: true, showInMusic: false }}
      />
    </AdminPage>
  );
}

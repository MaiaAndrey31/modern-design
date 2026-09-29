import { requireSession } from "@/lib/auth/guards";
import { createWorldStageAction } from "@/app/(admin)/admin/_actions/stages";
import { AdminPage } from "@/components/admin/ui";
import { WorldStageForm } from "../WorldStageForm";

export default async function NewWorldStagePage() {
  await requireSession();
  return (
    <AdminPage eyebrow="Conteúdo · World Stages" title="Novo palco">
      <WorldStageForm
        action={createWorldStageAction}
        initial={{
          yearLabel: "",
          titlePt: "",
          titleEn: null,
          locationPt: "",
          locationEn: null,
          descriptionPt: "",
          descriptionEn: null,
          image: null,
          video: null,
          showInNumbers: true,
          published: false,
        }}
      />
    </AdminPage>
  );
}

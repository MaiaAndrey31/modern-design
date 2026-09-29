import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { mediaValue } from "@/lib/admin/queries";
import { updateWorldStageAction } from "@/app/(admin)/admin/_actions/stages";
import { AdminPage } from "@/components/admin/ui";
import { WorldStageForm } from "../WorldStageForm";

export default async function EditWorldStagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const stage = await prisma.worldStage.findUnique({ where: { id }, include: { image: true, video: true } });
  if (!stage) notFound();

  return (
    <AdminPage eyebrow="Conteúdo · World Stages" title={`Editar: ${stage.titlePt}`}>
      <WorldStageForm
        action={updateWorldStageAction.bind(null, id)}
        initial={{
          yearLabel: stage.yearLabel,
          titlePt: stage.titlePt,
          titleEn: stage.titleEn,
          locationPt: stage.locationPt,
          locationEn: stage.locationEn,
          descriptionPt: stage.descriptionPt,
          descriptionEn: stage.descriptionEn,
          image: mediaValue(stage.image),
          video: mediaValue(stage.video),
          showInNumbers: stage.showInNumbers,
          published: stage.status === "PUBLISHED",
        }}
      />
    </AdminPage>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { WorldStageForm } from "../../WorldStageForm";
import { updateWorldStageAction } from "@/app/(admin)/admin/_actions/career";

export default async function EditWorldStagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stage = await prisma.worldStage.findUnique({ where: { id }, include: { image: true } });
  if (!stage) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar palco</h1>
      <div className="mt-6">
        <WorldStageForm
          initialValues={{
            yearLabel: stage.yearLabel,
            title: stage.title,
            location: stage.location,
            description: stage.description,
            showInNumbers: stage.showInNumbers,
            published: stage.status === "PUBLISHED",
            image: stage.image ? { id: stage.image.id, url: stage.image.url } : null,
          }}
          action={updateWorldStageAction.bind(null, id)}
        />
      </div>
    </div>
  );
}

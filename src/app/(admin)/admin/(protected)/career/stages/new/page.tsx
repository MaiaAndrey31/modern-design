import { WorldStageForm } from "../WorldStageForm";
import { createWorldStageAction } from "@/app/(admin)/admin/_actions/career";

export default function NewWorldStagePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Novo palco</h1>
      <div className="mt-6">
        <WorldStageForm initialValues={{ published: true, showInNumbers: true }} action={createWorldStageAction} />
      </div>
    </div>
  );
}

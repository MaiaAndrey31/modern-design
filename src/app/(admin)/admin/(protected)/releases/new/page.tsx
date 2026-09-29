import { ReleaseForm } from "../ReleaseForm";
import { createReleaseAction } from "@/app/(admin)/admin/_actions/releases";

export default function NewReleasePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Novo lançamento</h1>
      <div className="mt-6">
        <ReleaseForm initialValues={{ type: "SINGLE", published: true }} action={createReleaseAction} />
      </div>
    </div>
  );
}

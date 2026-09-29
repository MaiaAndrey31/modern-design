import { ShowForm } from "../ShowForm";
import { createShowAction } from "@/app/(admin)/admin/_actions/shows";

export default function NewShowPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Novo show</h1>
      <div className="mt-6">
        <ShowForm initialValues={{ country: "Brasil", published: true }} action={createShowAction} />
      </div>
    </div>
  );
}

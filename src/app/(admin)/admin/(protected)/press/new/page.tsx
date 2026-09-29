import { PressForm } from "../PressForm";
import { createPressItemAction } from "@/app/(admin)/admin/_actions/press";

export default function NewPressPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Nova matéria</h1>
      <div className="mt-6">
        <PressForm initialValues={{ published: true }} action={createPressItemAction} />
      </div>
    </div>
  );
}

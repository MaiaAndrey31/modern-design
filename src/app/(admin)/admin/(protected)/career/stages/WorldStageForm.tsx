"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { TextField, TextAreaField, ToggleField, SaveButton } from "@/components/admin/fields";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface WorldStageFormValues {
  yearLabel?: string;
  title?: string;
  location?: string;
  description?: string;
  showInNumbers?: boolean;
  published?: boolean;
  image?: MediaValue | null;
}

export function WorldStageForm({
  initialValues,
  action,
}: {
  initialValues: WorldStageFormValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [image, setImage] = useState<MediaValue | null>(initialValues.image ?? null);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <MediaPickerField label="Imagem" folder="stages" aspect="aspect-video" value={image} onChange={setImage} required />
      <input type="hidden" name="imageId" value={image?.id ?? ""} />

      <TextField label="Ano" name="yearLabel" required defaultValue={initialValues.yearLabel} error={state.fieldErrors?.yearLabel?.[0]} />
      <TextField label="Evento" name="title" required defaultValue={initialValues.title} error={state.fieldErrors?.title?.[0]} placeholder="Ex.: Copa do Mundo" />
      <TextField label="Local" name="location" required defaultValue={initialValues.location} error={state.fieldErrors?.location?.[0]} placeholder="Ex.: Brasil — Mineirão" />
      <TextAreaField label="Descrição" name="description" required defaultValue={initialValues.description} error={state.fieldErrors?.description?.[0]} />
      <ToggleField
        label="Exibir na seção de números"
        name="showInNumbers"
        defaultChecked={initialValues.showInNumbers ?? true}
        hint="Mostra o ano na composição editorial de credenciais da home."
      />
      <ToggleField label="Publicar imediatamente" name="published" defaultChecked={initialValues.published ?? true} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton>Salvar palco</SaveButton>
        <Link href="/admin/career?tab=stages" className="text-sm text-neutral-500 hover:text-neutral-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

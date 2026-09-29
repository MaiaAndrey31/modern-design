"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { TextField, TextAreaField, ToggleField, SaveButton } from "@/components/admin/fields";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface TimelineEventFormValues {
  yearLabel?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  published?: boolean;
  image?: MediaValue | null;
}

export function TimelineEventForm({
  initialValues,
  action,
}: {
  initialValues: TimelineEventFormValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [image, setImage] = useState<MediaValue | null>(initialValues.image ?? null);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <MediaPickerField label="Imagem (opcional)" folder="story" aspect="aspect-[4/5]" value={image} onChange={setImage} />
      <input type="hidden" name="imageId" value={image?.id ?? ""} />

      <TextField label="Ano" name="yearLabel" required defaultValue={initialValues.yearLabel} error={state.fieldErrors?.yearLabel?.[0]} placeholder="Ex.: 2012–2019" />
      <TextField label="Título" name="title" required defaultValue={initialValues.title} error={state.fieldErrors?.title?.[0]} />
      <TextField label="Subtítulo (opcional)" name="subtitle" defaultValue={initialValues.subtitle} />
      <TextAreaField label="Descrição" name="description" required defaultValue={initialValues.description} error={state.fieldErrors?.description?.[0]} />
      <ToggleField label="Publicar imediatamente" name="published" defaultChecked={initialValues.published ?? true} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton>Salvar marco</SaveButton>
        <Link href="/admin/career" className="text-sm text-neutral-500 hover:text-neutral-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

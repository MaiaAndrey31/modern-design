"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TextField, ToggleField, SaveButton } from "@/components/admin/fields";
import { LocalizedField, MediaField } from "@/components/admin/form";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface PressFormValues {
  outlet?: string;
  title?: string;
  dateLabel?: string;
  url?: string;
  publishedAt?: string;
  excerptPt?: string | null;
  excerptEn?: string | null;
  logo?: MediaValue | null;
  published?: boolean;
}

export function PressForm({
  initialValues,
  action,
}: {
  initialValues: PressFormValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <TextField label="Veículo" name="outlet" required defaultValue={initialValues.outlet} error={state.fieldErrors?.outlet?.[0]} placeholder="Ex.: Rádio Atenas FM" />
      <TextField label="Título" name="title" required defaultValue={initialValues.title} error={state.fieldErrors?.title?.[0]} />
      <TextField label="Data" name="dateLabel" required defaultValue={initialValues.dateLabel} error={state.fieldErrors?.dateLabel?.[0]} placeholder="Ex.: Março 2026" />
      <TextField label="Link (opcional)" name="url" type="url" defaultValue={initialValues.url} error={state.fieldErrors?.url?.[0]} />
      <TextField label="Data de publicação (opcional)" name="publishedAt" type="date" defaultValue={initialValues.publishedAt} error={state.fieldErrors?.publishedAt?.[0]} />
      <LocalizedField label="Resumo (opcional)" name="excerpt" multiline maxLength={600} defaultPt={initialValues.excerptPt} defaultEn={initialValues.excerptEn} state={state} />
      <MediaField label="Logo do veículo (opcional)" name="logoId" category="press" aspect="aspect-[3/1]" initial={initialValues.logo ?? null} error={state.fieldErrors?.logoId?.[0]} />
      <ToggleField label="Publicar imediatamente" name="published" defaultChecked={initialValues.published ?? true} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton>Salvar matéria</SaveButton>
        <Link href="/admin/press" className="text-sm text-neutral-500 hover:text-neutral-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

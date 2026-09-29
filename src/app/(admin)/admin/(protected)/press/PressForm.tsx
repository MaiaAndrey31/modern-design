"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TextField, TextAreaField, ToggleField, SaveButton } from "@/components/admin/fields";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface PressFormValues {
  outlet?: string;
  title?: string;
  dateLabel?: string;
  url?: string;
  excerpt?: string;
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
      <TextAreaField label="Resumo (opcional)" name="excerpt" defaultValue={initialValues.excerpt} error={state.fieldErrors?.excerpt?.[0]} />
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

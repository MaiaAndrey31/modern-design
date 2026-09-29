"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TextField, ToggleField, SaveButton } from "@/components/admin/fields";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface ShowFormValues {
  id?: string;
  title?: string;
  date?: string;
  time?: string;
  city?: string;
  state?: string;
  country?: string;
  venue?: string;
  address?: string;
  ticketUrl?: string;
  soldOut?: boolean;
  featured?: boolean;
  published?: boolean;
}

export function ShowForm({
  initialValues,
  action,
}: {
  initialValues: ShowFormValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <TextField label="Título (opcional)" name="title" defaultValue={initialValues.title} placeholder="Ex.: Réveillon Alfenas" />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Data"
          name="date"
          type="date"
          required
          defaultValue={initialValues.date}
          error={state.fieldErrors?.date?.[0]}
        />
        <TextField label="Horário (opcional)" name="time" placeholder="22:00" defaultValue={initialValues.time} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Cidade" name="city" required defaultValue={initialValues.city} error={state.fieldErrors?.city?.[0]} />
        <TextField label="Estado (opcional)" name="state" defaultValue={initialValues.state} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="País" name="country" defaultValue={initialValues.country ?? "Brasil"} />
        <TextField label="Local" name="venue" required defaultValue={initialValues.venue} error={state.fieldErrors?.venue?.[0]} />
      </div>

      <TextField label="Endereço (opcional)" name="address" defaultValue={initialValues.address} />
      <TextField
        label="Link de ingressos (opcional)"
        name="ticketUrl"
        type="url"
        placeholder="https://..."
        defaultValue={initialValues.ticketUrl}
        error={state.fieldErrors?.ticketUrl?.[0]}
      />

      <ToggleField label="Esgotado" name="soldOut" defaultChecked={initialValues.soldOut} />
      <ToggleField label="Destaque" name="featured" defaultChecked={initialValues.featured} />
      <ToggleField
        label="Publicar imediatamente"
        name="published"
        defaultChecked={initialValues.published ?? true}
        hint="Desative para deixar como rascunho, sem exibir no site."
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <SaveButton>Salvar show</SaveButton>
        <Link href="/admin/shows" className="text-sm text-neutral-500 hover:text-neutral-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

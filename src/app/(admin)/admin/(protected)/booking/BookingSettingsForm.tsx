"use client";

import { TextField, TextAreaField, ToggleField, SaveButton } from "@/components/admin/fields";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateBookingSettingsAction } from "@/app/(admin)/admin/_actions/booking";

export interface BookingSettingsFormValues {
  heading?: string;
  intro?: string;
  notifyEmail?: string;
  isFormEnabled?: boolean;
}

export function BookingSettingsForm({ initialValues }: { initialValues: BookingSettingsFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateBookingSettingsAction);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <TextField label="Título da seção" name="heading" required defaultValue={initialValues.heading} error={state.fieldErrors?.heading?.[0]} />
      <TextAreaField label="Texto de introdução" name="intro" required defaultValue={initialValues.intro} error={state.fieldErrors?.intro?.[0]} />
      <TextField
        label="E-mail para notificações (opcional)"
        name="notifyEmail"
        type="email"
        defaultValue={initialValues.notifyEmail}
        error={state.fieldErrors?.notifyEmail?.[0]}
      />
      <ToggleField label="Formulário ativo" name="isFormEnabled" defaultChecked={initialValues.isFormEnabled ?? true} />

      <p className="text-xs text-neutral-500">
        Os campos que o cliente preenche no formulário (nome, WhatsApp, cidade, tipo de evento etc.) são fixos e não
        podem ser alterados por aqui — fale com a equipe técnica para isso.
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton />
        {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
      </div>
    </form>
  );
}

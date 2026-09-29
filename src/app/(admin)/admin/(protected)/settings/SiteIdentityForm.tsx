"use client";

import { TextField, TextAreaField, SaveButton } from "@/components/admin/fields";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateSiteIdentityAction } from "@/app/(admin)/admin/_actions/settings";

export interface SiteIdentityFormValues {
  artistName?: string;
  roles?: string[];
  startYear?: number;
  bioShort?: string;
  whatsappNumber?: string;
}

export function SiteIdentityForm({ initialValues }: { initialValues: SiteIdentityFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateSiteIdentityAction);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        O nome do artista aparece no Hero, cabeçalho, rodapé e nos dados usados por buscadores — altere com cuidado.
      </div>

      <TextField label="Nome do artista" name="artistName" required defaultValue={initialValues.artistName} error={state.fieldErrors?.artistName?.[0]} />
      <TextField
        label="Funções (separadas por vírgula)"
        name="roles"
        required
        defaultValue={initialValues.roles?.join(", ")}
        placeholder="DJ, Producer, Entertainer"
        error={state.fieldErrors?.roles?.[0]}
      />
      <TextField
        label="Ano de início de carreira"
        name="startYear"
        type="number"
        required
        defaultValue={initialValues.startYear}
        error={state.fieldErrors?.startYear?.[0]}
      />
      <TextAreaField
        label="Biografia curta"
        name="bioShort"
        required
        defaultValue={initialValues.bioShort}
        error={state.fieldErrors?.bioShort?.[0]}
        rows={3}
      />
      <p className="-mt-4 text-xs text-neutral-500">
        Também usada como descrição padrão nos resultados de busca do Google, a menos que você defina uma diferente em SEO.
      </p>
      <TextField label="WhatsApp comercial (opcional)" name="whatsappNumber" defaultValue={initialValues.whatsappNumber} placeholder="5535999999999" />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton />
        {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
      </div>
    </form>
  );
}

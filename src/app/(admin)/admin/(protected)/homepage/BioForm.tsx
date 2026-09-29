"use client";

import { TextAreaField, SaveButton } from "@/components/admin/fields";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateBioAction } from "@/app/(admin)/admin/_actions/homepage";

export function BioForm({ bioFull }: { bioFull: string }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateBioAction);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <TextAreaField
        label="Biografia completa"
        name="bioFull"
        required
        rows={8}
        defaultValue={bioFull}
        error={state.fieldErrors?.bioFull?.[0]}
      />
      <p className="text-xs text-neutral-500">Este texto aparece na seção &quot;Press Kit&quot;, voltada para produtores e imprensa.</p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton />
        {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { SaveButton } from "@/components/admin/fields";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import { updateStatementBackgroundAction } from "@/app/(admin)/admin/_actions/homepage";

export function StatementForm({ background }: { background: MediaValue | null }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateStatementBackgroundAction);
  const [image, setImage] = useState<MediaValue | null>(background);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <MediaPickerField label="Imagem de fundo" folder="statement" aspect="aspect-video" value={image} onChange={setImage} />
      <input type="hidden" name="backgroundImageId" value={image?.id ?? ""} />
      <p className="text-xs text-neutral-500">
        Fundo da seção &quot;From Minas to the World.&quot;. O texto fica à esquerda, então prefira imagens com o destaque à direita. Sem imagem
        escolhida, o site usa a arte padrão (triângulo e globo).
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton />
        {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
      </div>
    </form>
  );
}

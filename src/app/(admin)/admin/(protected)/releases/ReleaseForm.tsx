"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { TextField, SelectField, ToggleField, SaveButton } from "@/components/admin/fields";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface ReleaseFormValues {
  title?: string;
  yearLabel?: string;
  type?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  published?: boolean;
  cover?: MediaValue | null;
}

export function ReleaseForm({
  initialValues,
  action,
}: {
  initialValues: ReleaseFormValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [cover, setCover] = useState<MediaValue | null>(initialValues.cover ?? null);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <MediaPickerField label="Capa" folder="releases" aspect="aspect-square" value={cover} onChange={setCover} required />
      <input type="hidden" name="coverId" value={cover?.id ?? ""} />

      <TextField label="Título" name="title" required defaultValue={initialValues.title} error={state.fieldErrors?.title?.[0]} />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Ano" name="yearLabel" required defaultValue={initialValues.yearLabel} error={state.fieldErrors?.yearLabel?.[0]} />
        <SelectField label="Tipo" name="type" defaultValue={initialValues.type ?? "SINGLE"}>
          <option value="SINGLE">Single</option>
          <option value="EP">EP</option>
          <option value="ALBUM">Álbum</option>
          <option value="REMIX">Remix</option>
        </SelectField>
      </div>

      <TextField label="Link do Spotify (opcional)" name="spotifyUrl" type="url" defaultValue={initialValues.spotifyUrl} error={state.fieldErrors?.spotifyUrl?.[0]} />
      <TextField label="Link do Apple Music (opcional)" name="appleMusicUrl" type="url" defaultValue={initialValues.appleMusicUrl} error={state.fieldErrors?.appleMusicUrl?.[0]} />
      <TextField label="Link do YouTube (opcional)" name="youtubeUrl" type="url" defaultValue={initialValues.youtubeUrl} error={state.fieldErrors?.youtubeUrl?.[0]} />

      <ToggleField label="Publicar imediatamente" name="published" defaultChecked={initialValues.published ?? true} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton>Salvar lançamento</SaveButton>
        <Link href="/admin/releases" className="text-sm text-neutral-500 hover:text-neutral-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

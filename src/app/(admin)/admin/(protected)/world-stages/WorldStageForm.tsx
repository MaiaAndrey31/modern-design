"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LocalizedField, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface WorldStageValues {
  yearLabel: string;
  titlePt: string;
  titleEn: string | null;
  locationPt: string;
  locationEn: string | null;
  descriptionPt: string;
  descriptionEn: string | null;
  image: MediaValue | null;
  video: MediaValue | null;
  showInNumbers: boolean;
  published: boolean;
}

export function WorldStageForm({ initial, action }: { initial: WorldStageValues; action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, { ok: true });
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      <Card title="Textos">
        <TextField label="Ano" name="yearLabel" required maxLength={16} placeholder="2014" defaultValue={initial.yearLabel} error={err("yearLabel")} />
        <LocalizedField label="Título" name="title" required maxLength={80} defaultPt={initial.titlePt} defaultEn={initial.titleEn} state={state} />
        <LocalizedField label="Local" name="location" required maxLength={80} defaultPt={initial.locationPt} defaultEn={initial.locationEn} state={state} />
        <LocalizedField label="Descrição" name="description" required multiline maxLength={600} defaultPt={initial.descriptionPt} defaultEn={initial.descriptionEn} state={state} />
      </Card>

      <Card title="Mídia">
        <div className="grid gap-6 md:grid-cols-2">
          <MediaField label="Imagem" name="imageId" category="stages" initial={initial.image} error={err("imageId")} />
          <MediaField label="Vídeo (opcional)" name="videoId" category="stages" kind="video" initial={initial.video} hint="Toca no lugar da imagem, sem som." error={err("videoId")} />
        </div>
      </Card>

      <Card title="Publicação">
        <ToggleField label="Contar na seção Números" name="showInNumbers" defaultChecked={initial.showInNumbers} />
        <ToggleField label="Publicado" name="published" defaultChecked={initial.published} />
      </Card>

      <FormFooter
        state={state}
        label="Salvar palco"
        extra={
          <Link href="/admin/world-stages" className="text-sm text-neutral-500 hover:text-neutral-900">
            Cancelar
          </Link>
        }
      />
    </form>
  );
}

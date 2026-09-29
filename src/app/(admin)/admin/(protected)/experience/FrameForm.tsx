"use client";

import { SelectField, TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LocalizedField, MediaField } from "@/components/admin/form";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateExperienceFrameAction } from "@/app/(admin)/admin/_actions/content";

export interface FrameValues {
  layout: "WIDE" | "TALL";
  offsetPx: number;
  media: MediaValue | null;
  altPt: string;
  altEn: string | null;
  published: boolean;
}

export function FrameForm({ slot, initial }: { slot: number; initial: FrameValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateExperienceFrameAction.bind(null, slot));
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-5">
      <MediaField
        label="Imagem"
        name="mediaId"
        category="experience"
        aspect={initial.layout === "TALL" ? "aspect-[3/4]" : "aspect-video"}
        initial={initial.media}
        error={err("mediaId")}
      />
      <LocalizedField label="Texto alternativo" name="alt" required maxLength={200} defaultPt={initial.altPt} defaultEn={initial.altEn} state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Formato" name="layout" defaultValue={initial.layout}>
          <option value="WIDE">Horizontal</option>
          <option value="TALL">Vertical</option>
        </SelectField>
        <TextField label="Deslocamento vertical (px, −120 a 120)" name="offsetPx" type="number" min={-120} max={120} defaultValue={initial.offsetPx} error={err("offsetPx")} />
      </div>
      <ToggleField label="Publicado" name="published" defaultChecked={initial.published} />
      <FormFooter state={state} showSaved={showSaved} label="Salvar quadro" />
    </form>
  );
}

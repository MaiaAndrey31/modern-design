"use client";

import { FormFooter, LocalizedField, MediaField } from "@/components/admin/form";
import { Card, Notice } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updatePressKitAction } from "@/app/(admin)/admin/_actions/content";

export interface PressKitValues {
  bioOverridePt: string | null;
  bioOverrideEn: string | null;
  downloadsNotePt: string | null;
  downloadsNoteEn: string | null;
  oneSheet: MediaValue | null;
  photoPack: MediaValue | null;
  logoPack: MediaValue | null;
}

export function PressKitForm({ initial }: { initial: PressKitValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updatePressKitAction);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Biografia">
        <LocalizedField
          label="Bio para imprensa (opcional)"
          name="bioOverride"
          multiline
          rows={8}
          maxLength={4000}
          hint="Vazio = usa a bio de Conteúdo → Perfil."
          defaultPt={initial.bioOverridePt}
          defaultEn={initial.bioOverrideEn}
          state={state}
        />
      </Card>

      <Card title="Arquivos">
        <Notice>
          Por enquanto a biblioteca aceita imagens (JPG, PNG, WebP, AVIF) e vídeos MP4. PDF e ZIP entram com as melhorias da biblioteca de mídia.
        </Notice>
        <div className="grid gap-6 md:grid-cols-3">
          <MediaField label="One-sheet" name="oneSheetId" category="press" aspect="aspect-[3/4]" initial={initial.oneSheet} error={err("oneSheetId")} />
          <MediaField label="Fotos" name="photoPackId" category="press" initial={initial.photoPack} error={err("photoPackId")} />
          <MediaField label="Logos" name="logoPackId" category="press" initial={initial.logoPack} error={err("logoPackId")} />
        </div>
        <LocalizedField
          label="Nota sobre downloads"
          name="downloadsNote"
          maxLength={200}
          placeholder="Ex.: Materiais em alta resolução mediante solicitação."
          defaultPt={initial.downloadsNotePt}
          defaultEn={initial.downloadsNoteEn}
          state={state}
        />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

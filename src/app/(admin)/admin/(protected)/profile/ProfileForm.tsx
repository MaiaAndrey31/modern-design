"use client";

import { TextField } from "@/components/admin/fields";
import { FormFooter, LocalizedField, LocalizedLinesField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateProfileAction } from "@/app/(admin)/admin/_actions/settings";

export interface ProfileValues {
  rolesPt: string[];
  rolesEn: string[];
  bioPt: string;
  bioEn: string | null;
  originLabelPt: string | null;
  originLabelEn: string | null;
  foundedYear: number | null;
}

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateProfileAction);

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Apresentação">
        <LocalizedLinesField
          label="Funções"
          name="roles"
          hint="Uma por linha (ex.: DJ, Produtor). Exibidas no Hero e no footer, separadas por “·”."
          defaultPt={initial.rolesPt}
          defaultEn={initial.rolesEn}
          state={state}
        />
        <LocalizedField
          label="Origem"
          name="originLabel"
          maxLength={80}
          placeholder="Ex.: São Paulo — Brasil"
          defaultPt={initial.originLabelPt}
          defaultEn={initial.originLabelEn}
          state={state}
        />
        <TextField
          label="Ano de início"
          name="foundedYear"
          type="number"
          min={1800}
          max={2100}
          defaultValue={initial.foundedYear ?? ""}
          error={state.fieldErrors?.foundedYear?.[0]}
        />
        <p className="text-xs text-neutral-500">Usado em “Desde …” e no contador de anos da seção Números. Vazio = não exibido.</p>
      </Card>

      <Card title="Biografia" description="Texto completo usado no Press Kit (quando não houver bio específica) e em dados estruturados.">
        <LocalizedField label="Bio" name="bio" multiline rows={8} maxLength={4000} defaultPt={initial.bioPt} defaultEn={initial.bioEn} state={state} />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

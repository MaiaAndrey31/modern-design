"use client";

import { useState } from "react";
import { TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LocalizedLinesField, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateStatementAction } from "@/app/(admin)/admin/_actions/content";

export interface StatementValues {
  linesPt: string[];
  linesEn: string[];
  accentIndex: number | null;
  background: MediaValue | null;
  showGlobe: boolean;
}

export function StatementForm({ initial }: { initial: StatementValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateStatementAction);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];
  const [accentLine, setAccentLine] = useState(initial.accentIndex === null ? "" : String(initial.accentIndex + 1));

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Frase">
        <LocalizedLinesField
          label="Linhas"
          name="lines"
          hint="Uma linha por quebra (até 6). Sem linhas, a seção não aparece."
          defaultPt={initial.linesPt}
          defaultEn={initial.linesEn}
          state={state}
        />
        <TextField
          label="Linha em destaque (número, começando em 1)"
          name="accentLine"
          type="number"
          min={1}
          max={6}
          value={accentLine}
          onChange={(e) => setAccentLine(e.target.value)}
          error={err("accentIndex")}
        />
        {/* The DB stores a 0-based index; the admin shows 1-based positions. */}
        <input type="hidden" name="accentIndex" value={accentLine ? String(Number(accentLine) - 1) : ""} />
        <p className="text-xs text-neutral-500">Vazio = nenhuma linha na cor de destaque.</p>
      </Card>

      <Card title="Visual">
        <MediaField label="Imagem de fundo" name="backgroundImageId" category="sections" initial={initial.background} error={err("backgroundImageId")} />
        <ToggleField label="Globo 3D" name="showGlobe" defaultChecked={initial.showGlobe} hint="Globo com as rotas a partir da origem (Conteúdo → Lugares). Somente desktop." />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

"use client";

import { useState } from "react";
import { FormFooter, LocalizedField, LocalizedLinesField, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateNarrativeAction } from "@/app/(admin)/admin/_actions/content";
import { STORY_LIMITS } from "@/lib/story/registry";

export interface NarrativeValues {
  linesPt: string[];
  linesEn: string[];
  finalWordPt: string | null;
  finalWordEn: string | null;
  vhPerLine: number;
  background: MediaValue | null;
}

const { min, max } = STORY_LIMITS.narrativeVhPerLine;

export function NarrativeForm({ initial, brandName }: { initial: NarrativeValues; brandName: string }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateNarrativeAction);
  const [vh, setVh] = useState(initial.vhPerLine);

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Textos">
        <LocalizedLinesField
          label="Frases"
          name="lines"
          hint="Uma por linha (até 8). Sem frases, a seção não aparece."
          defaultPt={initial.linesPt}
          defaultEn={initial.linesEn}
          state={state}
        />
        <LocalizedField
          label="Palavra final"
          name="finalWord"
          maxLength={40}
          hint={`Vazio = nome da marca (“${brandName}”).`}
          defaultPt={initial.finalWordPt}
          defaultEn={initial.finalWordEn}
          state={state}
        />
      </Card>

      <Card title="Ritmo e fundo">
        <div>
          <label htmlFor="vhPerLine" className="block text-sm font-medium text-neutral-700">
            Duração de cada frase no scroll: <span className="tabular-nums">{vh}</span>% da tela
          </label>
          <input
            id="vhPerLine"
            name="vhPerLine"
            type="range"
            min={min}
            max={max}
            step={5}
            value={vh}
            onChange={(e) => setVh(Number(e.target.value))}
            className="mt-2 w-full max-w-md accent-neutral-900"
          />
          <p className="text-xs text-neutral-500">Menor = mais rápido. Limitado entre {min}% e {max}% para preservar a animação.</p>
        </div>
        <MediaField label="Imagem de fundo" name="backgroundImageId" category="sections" initial={initial.background} error={state.fieldErrors?.backgroundImageId?.[0]} />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

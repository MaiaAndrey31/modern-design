"use client";

import { FormFooter, LocalizedField, LocalizedLinesField } from "@/components/admin/form";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateStorySectionAction } from "@/app/(admin)/admin/_actions/content";

export interface StorySectionValues {
  introQuestionPt: string | null;
  introQuestionEn: string | null;
  thesisLinesPt: string[];
  thesisLinesEn: string[];
  outroLinesPt: string[];
  outroLinesEn: string[];
}

export function StorySectionForm({ initial }: { initial: StorySectionValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateStorySectionAction);
  return (
    <form action={formAction} className="space-y-5">
      <LocalizedField label="Pergunta de abertura" name="introQuestion" maxLength={80} placeholder="Como?" defaultPt={initial.introQuestionPt} defaultEn={initial.introQuestionEn} state={state} />
      <LocalizedLinesField label="Tese (virada para o palco global)" name="thesisLines" rows={3} defaultPt={initial.thesisLinesPt} defaultEn={initial.thesisLinesEn} state={state} />
      <LocalizedLinesField label="Encerramento" name="outroLines" rows={3} defaultPt={initial.outroLinesPt} defaultEn={initial.outroLinesEn} state={state} />
      <FormFooter state={state} showSaved={showSaved} label="Salvar interlúdios" />
    </form>
  );
}

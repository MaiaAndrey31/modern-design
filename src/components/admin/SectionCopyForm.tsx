"use client";

import Link from "next/link";
import { LinkField, LocalizedField, FormFooter } from "./form";
import { useSavedFeedback } from "./useSavedFeedback";
import { updateSectionCopyAction } from "@/app/(admin)/admin/_actions/sections";
import { SECTION_REGISTRY, type SectionKey } from "@/lib/sections/registry";
import type { SectionDefaults } from "@/lib/content/defaults";

/**
 * Generic texts of a section (eyebrow, title, empty state, CTA…). Renders
 * only the fields the SECTION_REGISTRY declares for `sectionKey`, with the
 * labels the registry gives them — so e.g. Numbers shows "Rótulo dos anos"
 * instead of "Título".
 */
export function SectionCopyForm({ sectionKey, values }: { sectionKey: SectionKey; values: SectionDefaults }) {
  const def = SECTION_REGISTRY[sectionKey];
  const { state, formAction, showSaved } = useSavedFeedback(updateSectionCopyAction.bind(null, sectionKey));
  const f = def.fields;

  if (Object.keys(f).length === 0) return null;

  return (
    <form action={formAction} className="space-y-5">
      {!values.enabled && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta seção está desativada e não aparece no site.{" "}
          <Link href="/admin/sections" className="underline">
            Ativar em Seções
          </Link>
        </p>
      )}
      {f.eyebrow && (
        <LocalizedField label={f.eyebrow.label} hint={f.eyebrow.help} name="eyebrow" defaultPt={values.eyebrowPt} defaultEn={values.eyebrowEn} maxLength={80} state={state} />
      )}
      {f.title && (
        <LocalizedField
          label={f.title.label}
          hint={f.title.help}
          name="title"
          multiline={f.title.multiline}
          rows={2}
          defaultPt={values.titlePt}
          defaultEn={values.titleEn}
          maxLength={200}
          state={state}
        />
      )}
      {f.subtitle && (
        <LocalizedField label={f.subtitle.label} hint={f.subtitle.help} name="subtitle" defaultPt={values.subtitlePt} defaultEn={values.subtitleEn} maxLength={200} state={state} />
      )}
      {f.description && (
        <LocalizedField
          label={f.description.label}
          hint={f.description.help}
          name="description"
          multiline
          defaultPt={values.descriptionPt}
          defaultEn={values.descriptionEn}
          maxLength={1000}
          state={state}
        />
      )}
      {f.emptyText && (
        <LocalizedField
          label={f.emptyText.label}
          hint={f.emptyText.help ?? "Exibido quando não há itens publicados."}
          name="emptyText"
          multiline
          rows={2}
          defaultPt={values.emptyTextPt}
          defaultEn={values.emptyTextEn}
          maxLength={400}
          state={state}
        />
      )}
      {f.cta && (
        <LinkField
          label={f.cta.label}
          prefix="cta"
          defaultType={values.ctaType}
          defaultTarget={values.ctaTarget}
          defaultLabelPt={values.ctaLabelPt}
          defaultLabelEn={values.ctaLabelEn}
          state={state}
        />
      )}
      <FormFooter state={state} showSaved={showSaved} label="Salvar textos da seção" />
    </form>
  );
}

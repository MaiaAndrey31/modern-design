"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/admin/fields";
import { FormFooter } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateTypographyAction } from "@/app/(admin)/admin/_actions/appearance";
import { FONT_IDS, FONT_REGISTRY, closestWeight, fontStack, resolveFont, type FontRole } from "@/lib/fonts/registry";
import { googleFontsHref } from "@/lib/fonts/google";
import type { TypographyDefaults } from "@/lib/content/defaults";

const ROLES: { role: FontRole; label: string; hint: string }[] = [
  { role: "display", label: "Display", hint: "Grandes títulos, nome no Hero, números." },
  { role: "heading", label: "Títulos", hint: "Títulos de seções e capítulos." },
  { role: "body", label: "Texto", hint: "Parágrafos, botões, formulários." },
];

const CATEGORY_LABELS = { sans: "Sem serifa", serif: "Serifada", display: "Display", mono: "Monoespaçada" } as const;

export function TypographyForm({ initial }: { initial: TypographyDefaults }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateTypographyAction);
  const [values, setValues] = useState(initial);

  const fontOf = (role: FontRole) => resolveFont(values[`${role}FontId`], role);
  const setFont = (role: FontRole, id: string) =>
    setValues((v) => {
      const font = resolveFont(id, role);
      // Keep the weight valid for the new font.
      return { ...v, [`${role}FontId`]: id, [`${role}Weight`]: closestWeight(font, v[`${role}Weight`]) };
    });

  // Preview loads ONLY the selected fonts, from a URL built from the registry.
  const previewHref = googleFontsHref([values.displayFontId, values.headingFontId, values.bodyFontId]);
  const style = (role: FontRole) => ({
    fontFamily: fontStack(fontOf(role)),
    fontWeight: values[`${role}Weight`],
    letterSpacing: role === "body" ? undefined : `${values[`${role}Tracking` as "displayTracking" | "headingTracking"]}em`,
  });

  return (
    <form action={formAction} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      {previewHref && <link rel="stylesheet" href={previewHref} precedence="default" />}

      <div className="space-y-8">
        {ROLES.map(({ role, label, hint }) => {
          const font = fontOf(role);
          return (
            <Card key={role} title={label} description={hint}>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Fonte" name={`${role}FontId`} value={values[`${role}FontId`]} onChange={(e) => setFont(role, e.target.value)}>
                  {FONT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {FONT_REGISTRY[id].label} — {CATEGORY_LABELS[FONT_REGISTRY[id].category]}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Peso"
                  name={`${role}Weight`}
                  value={values[`${role}Weight`]}
                  onChange={(e) => setValues((v) => ({ ...v, [`${role}Weight`]: Number(e.target.value) }))}
                  error={state.fieldErrors?.[`${role}Weight`]?.[0]}
                >
                  {font.weights.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </SelectField>
                {role !== "body" && (
                  <TextField
                    label="Espaçamento entre letras (em)"
                    name={`${role}Tracking`}
                    type="number"
                    step={0.01}
                    min={-0.1}
                    max={0.5}
                    value={values[`${role}Tracking` as "displayTracking" | "headingTracking"]}
                    onChange={(e) => setValues((v) => ({ ...v, [`${role}Tracking`]: Number(e.target.value) }))}
                    error={state.fieldErrors?.[`${role}Tracking`]?.[0]}
                  />
                )}
              </div>
            </Card>
          );
        })}

        <Card title="Escala geral">
          <TextField
            label="Multiplicador dos tamanhos (0,85 a 1,15)"
            name="typeScale"
            type="number"
            step={0.01}
            min={0.85}
            max={1.15}
            value={values.typeScale}
            onChange={(e) => setValues((v) => ({ ...v, typeScale: Number(e.target.value) }))}
            error={state.fieldErrors?.typeScale?.[0]}
          />
        </Card>

        <FormFooter state={state} showSaved={showSaved} />
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Card title="Pré-visualização" description="Amostra com as fontes selecionadas.">
          <div className="space-y-5 rounded-md bg-neutral-950 p-6 text-neutral-50">
            <p className="text-4xl uppercase leading-none" style={style("display")}>
              From origin to the world
            </p>
            <p className="text-2xl leading-tight" style={style("heading")}>
              Um título de seção, capítulo a capítulo.
            </p>
            <p className="text-[15px] leading-relaxed text-neutral-300" style={style("body")}>
              Texto corrido do site: descrições, legendas e formulários. Acentuação — ã, é, ç, õ — e números 0123456789.
            </p>
          </div>
        </Card>
      </div>
    </form>
  );
}

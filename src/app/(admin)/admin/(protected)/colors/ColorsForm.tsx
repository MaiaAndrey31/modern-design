"use client";

import { useState } from "react";
import { TextField } from "@/components/admin/fields";
import { ColorField, FormFooter } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateThemeAction } from "@/app/(admin)/admin/_actions/appearance";
import { THEME_COLOR_TOKENS, THEME_RADIUS_TOKENS, contrastRatio, type ThemeColorKey } from "@/lib/theme/registry";
import type { ThemeDefaults } from "@/lib/content/defaults";

export type ThemeValues = ThemeDefaults;

/** Pairs that must stay readable, with the WCAG AA threshold that applies. */
const CONTRAST_CHECKS: { fg: ThemeColorKey; bg: ThemeColorKey; label: string; min: number }[] = [
  { fg: "foreground", bg: "background", label: "Texto principal / fundo", min: 4.5 },
  { fg: "textMuted", bg: "background", label: "Texto secundário / fundo", min: 4.5 },
  { fg: "foreground", bg: "surface", label: "Texto principal / superfície", min: 4.5 },
  { fg: "primaryContrast", bg: "primary", label: "Texto do botão / cor principal", min: 4.5 },
  { fg: "primary", bg: "background", label: "Cor principal / fundo (títulos, links)", min: 3 },
];

function ContrastBadge({ ratio, min }: { ratio: number; min: number }) {
  const ok = ratio >= min;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {ratio.toFixed(2)}:1 {ok ? "OK" : `abaixo de ${min}:1`}
    </span>
  );
}

function SitePreview({ t }: { t: ThemeValues }) {
  return (
    <div className="overflow-hidden border" style={{ background: t.background, color: t.foreground, borderColor: t.border, borderRadius: Math.min(t.cardRadius, 24) }}>
      <div className="space-y-4 p-6">
        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: t.textMuted }}>
          Eyebrow · texto secundário
        </p>
        <p className="text-3xl font-bold leading-tight">
          Título principal <span style={{ color: t.primary }}>em destaque.</span>
        </p>
        <p className="max-w-md text-sm" style={{ color: t.textMuted }}>
          Parágrafo com o texto secundário do site, usado em descrições e legendas.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-5 py-2.5 text-sm font-medium" style={{ background: t.primary, color: t.primaryContrast, borderRadius: t.buttonRadius }}>
            Botão principal
          </span>
          <span className="border px-5 py-2.5 text-sm" style={{ borderColor: t.border, borderRadius: t.buttonRadius }}>
            Botão secundário
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border p-4" style={{ background: t.surface, borderColor: t.border, borderRadius: t.cardRadius }}>
            <p className="text-xs" style={{ color: t.textMuted }}>Superfície</p>
            <p className="mt-1 text-sm font-medium">Card</p>
          </div>
          <div className="p-4" style={{ background: t.secondary, color: t.background, borderRadius: t.cardRadius }}>
            <p className="text-xs opacity-80">Secundária</p>
            <p className="mt-1 text-sm font-medium">Aa</p>
          </div>
          <div className="p-4" style={{ background: t.accent, color: t.background, borderRadius: t.cardRadius }}>
            <p className="text-xs opacity-80">Destaque</p>
            <p className="mt-1 text-sm font-medium">Aa</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <span style={{ color: t.success }}>● Enviado com sucesso</span>
          <span style={{ color: t.danger }}>● Campo obrigatório</span>
        </div>
      </div>
    </div>
  );
}

export function ColorsForm({ initial, defaults }: { initial: ThemeValues; defaults: ThemeValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateThemeAction);
  const [theme, setTheme] = useState<ThemeValues>(initial);
  // Remount the colour inputs when resetting so their text drafts follow.
  const [version, setVersion] = useState(0);
  const set = (key: ThemeColorKey) => (value: string) => setTheme((t) => ({ ...t, [key]: value }));

  return (
    <form action={formAction} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      <div className="space-y-8">
        <Card title="Cores" key={version}>
          <div className="grid gap-5 sm:grid-cols-2">
            {THEME_COLOR_TOKENS.map((token) => (
              <ColorField
                key={token.key}
                label={token.label}
                name={token.key}
                value={theme[token.key]}
                onChange={set(token.key)}
                hint={<code className="text-[11px] text-neutral-400">{token.cssVar}</code>}
                error={state.fieldErrors?.[token.key]?.[0]}
              />
            ))}
          </div>
        </Card>

        <Card title="Formas">
          <div className="grid gap-5 sm:grid-cols-2">
            {THEME_RADIUS_TOKENS.map((token) => (
              <TextField
                key={token.key}
                label={`${token.label} (px)`}
                name={token.key}
                type="number"
                min={token.min}
                max={token.max}
                value={theme[token.key]}
                onChange={(e) => setTheme((t) => ({ ...t, [token.key]: Number(e.target.value) }))}
                error={state.fieldErrors?.[token.key]?.[0]}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500">999 = totalmente arredondado (formato de pílula).</p>
        </Card>

        <FormFooter
          state={state}
          showSaved={showSaved}
          extra={
            <button
              type="button"
              onClick={() => {
                setTheme(defaults);
                setVersion((v) => v + 1);
              }}
              className="text-sm text-neutral-500 underline hover:text-neutral-900"
            >
              Restaurar padrão do Modern
            </button>
          }
        />
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card title="Pré-visualização do site" description="Representa o site — o painel mantém a identidade do Modern.">
          <SitePreview t={theme} />
        </Card>
        <Card title="Contraste (WCAG AA)">
          <ul className="space-y-2">
            {CONTRAST_CHECKS.map((check) => (
              <li key={check.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-600">{check.label}</span>
                <ContrastBadge ratio={contrastRatio(theme[check.fg], theme[check.bg])} min={check.min} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </form>
  );
}

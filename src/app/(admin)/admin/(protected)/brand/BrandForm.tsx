"use client";

import Image from "next/image";
import { useState } from "react";
import { TextField } from "@/components/admin/fields";
import { FormFooter, LocalizedField, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { updateBrandAction } from "@/app/(admin)/admin/_actions/appearance";

type LogoField = "primaryLogoId" | "secondaryLogoId" | "lightLogoId" | "darkLogoId" | "iconId" | "faviconId";

const LOGO_SLOTS: { field: LogoField; label: string; hint: string; aspect: string }[] = [
  { field: "primaryLogoId", label: "Logo principal", hint: "Usada no header por padrão.", aspect: "aspect-[3/1]" },
  { field: "secondaryLogoId", label: "Logo alternativa", hint: "Versão horizontal/compacta, se houver.", aspect: "aspect-[3/1]" },
  { field: "lightLogoId", label: "Logo clara", hint: "Para fundos escuros.", aspect: "aspect-[3/1]" },
  { field: "darkLogoId", label: "Logo escura", hint: "Para fundos claros.", aspect: "aspect-[3/1]" },
  { field: "iconId", label: "Ícone", hint: "Quadrado (mín. 180×180). Usado como ícone de atalho no celular.", aspect: "aspect-square" },
  { field: "faviconId", label: "Favicon", hint: "PNG quadrado (mín. 180×180). Ícone da aba do navegador.", aspect: "aspect-square" },
];

export interface BrandFormValues {
  brandName: string;
  shortName: string;
  monogram: string;
  taglinePt: string;
  taglineEn: string | null;
  descriptionPt: string;
  descriptionEn: string | null;
  logos: Record<LogoField, MediaValue | null>;
}

function LogoPreview({ logo, fallback, dark }: { logo: MediaValue | null; fallback: string; dark: boolean }) {
  return (
    <div className={`flex h-24 items-center justify-center rounded-md px-6 ${dark ? "bg-neutral-950" : "border border-neutral-200 bg-white"}`}>
      {logo ? (
        <div className="relative h-12 w-full">
          <Image src={logo.url} alt="" fill sizes="240px" className="object-contain" unoptimized />
        </div>
      ) : (
        <span className={`truncate text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-neutral-900"}`}>{fallback}</span>
      )}
    </div>
  );
}

export function BrandForm({ initial }: { initial: BrandFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateBrandAction);
  const [logos, setLogos] = useState(initial.logos);
  const [brandName, setBrandName] = useState(initial.brandName);
  const [monogram, setMonogram] = useState(initial.monogram);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  // Which logo the site would use on each background (same fallback order the site uses).
  const onLight = logos.darkLogoId ?? logos.primaryLogoId;
  const onDark = logos.lightLogoId ?? logos.primaryLogoId;
  const favicon = logos.faviconId ?? logos.iconId;

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Identidade">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            label="Nome da marca"
            name="brandName"
            required
            maxLength={80}
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            error={err("brandName")}
          />
          <TextField label="Nome curto" name="shortName" required maxLength={40} defaultValue={initial.shortName} error={err("shortName")} />
          <TextField
            label="Sigla (até 3 caracteres)"
            name="monogram"
            required
            maxLength={3}
            value={monogram}
            onChange={(e) => setMonogram(e.target.value)}
            error={err("monogram")}
          />
        </div>
        <LocalizedField label="Tagline" name="tagline" required maxLength={160} defaultPt={initial.taglinePt} defaultEn={initial.taglineEn} state={state} />
        <LocalizedField
          label="Descrição"
          name="description"
          required
          multiline
          maxLength={600}
          hint="Usada como descrição padrão de SEO e compartilhamento."
          defaultPt={initial.descriptionPt}
          defaultEn={initial.descriptionEn}
          state={state}
        />
      </Card>

      <Card title="Logos e ícones" description="PNG ou WebP (SVG não é aceito por segurança). Sem logo, o site usa o nome da marca em texto.">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {LOGO_SLOTS.map((slot) => (
            <MediaField
              key={slot.field}
              label={slot.label}
              name={slot.field}
              category="branding"
              aspect={slot.aspect}
              hint={slot.hint}
              initial={initial.logos[slot.field]}
              error={err(slot.field)}
              onChange={(value) => setLogos((current) => ({ ...current, [slot.field]: value }))}
            />
          ))}
        </div>
      </Card>

      <Card title="Pré-visualização" description="Como a marca aparece no site.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-neutral-500">Sobre fundo claro</p>
            <LogoPreview logo={onLight} fallback={brandName || "—"} dark={false} />
          </div>
          <div>
            <p className="mb-2 text-xs text-neutral-500">Sobre fundo escuro</p>
            <LogoPreview logo={onDark} fallback={brandName || "—"} dark />
          </div>
          <div>
            <p className="mb-2 text-xs text-neutral-500">Wordmark (sem logo)</p>
            <LogoPreview logo={null} fallback={brandName || "—"} dark />
          </div>
          <div className="flex gap-4">
            <div>
              <p className="mb-2 text-xs text-neutral-500">Sigla</p>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold tracking-widest text-white">
                {monogram || "—"}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs text-neutral-500">Favicon</p>
              <div className="flex h-10 max-w-[240px] items-center gap-2 rounded-t-lg border border-b-0 border-neutral-200 bg-neutral-100 px-3">
                {favicon ? (
                  <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm">
                    <Image src={favicon.url} alt="" fill sizes="16px" className="object-cover" unoptimized />
                  </span>
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-sm bg-neutral-300" />
                )}
                <span className="truncate text-xs text-neutral-700">{brandName || "Site"}</span>
              </div>
              {!favicon && <p className="mt-1 text-xs text-neutral-500">Sem favicon: o site usa um ícone neutro.</p>}
            </div>
          </div>
        </div>
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

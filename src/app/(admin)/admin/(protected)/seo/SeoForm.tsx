"use client";

import { useState } from "react";
import Image from "next/image";
import { TextField, ToggleField, inputClass } from "@/components/admin/fields";
import { FormFooter, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateSeoSettingsAction } from "@/app/(admin)/admin/_actions/seo";

export interface SeoFormValues {
  metaTitlePt: string;
  metaTitleEn: string;
  metaDescriptionPt: string;
  metaDescriptionEn: string;
  twitterHandle: string;
  robotsIndex: boolean;
  ogImage: MediaValue | null;
  /** Shown when the title/description are left empty. */
  fallbackTitle: string;
  fallbackDescription: string;
  siteUrl: string;
}

function CharCounter({ value, target, max }: { value: string; target: number; max: number }) {
  const len = value.length;
  const color = len <= target ? "text-green-600" : len <= max ? "text-amber-600" : "text-red-600";
  return <span className={`text-xs tabular-nums ${color}`}>{len}/{max}</span>;
}

/** PT/EN pair with live counters (SEO lengths matter more than elsewhere). */
function CountedPair({
  label,
  name,
  values,
  onChange,
  target,
  max,
  multiline,
  fallback,
  errors,
}: {
  label: string;
  name: string;
  values: { pt: string; en: string };
  onChange: (v: { pt: string; en: string }) => void;
  target: number;
  max: number;
  multiline?: boolean;
  fallback: string;
  errors: { pt?: string; en?: string };
}) {
  const Control = multiline ? "textarea" : "input";
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-neutral-700">{label}</legend>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {(["pt", "en"] as const).map((lang) => (
          <div key={lang}>
            <div className="flex items-center justify-between">
              <label htmlFor={`${name}-${lang}`} className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                {lang === "pt" ? "Português" : "English"}
              </label>
              <CharCounter value={values[lang]} target={target} max={max} />
            </div>
            <Control
              id={`${name}-${lang}`}
              name={`${name}${lang === "pt" ? "Pt" : "En"}`}
              value={values[lang]}
              onChange={(e) => onChange({ ...values, [lang]: e.target.value })}
              maxLength={max}
              className={inputClass}
              {...(multiline ? { rows: 4 } : {})}
            />
            {errors[lang] ? (
              <p className="mt-1 text-xs text-red-600">{errors[lang]}</p>
            ) : (
              !values[lang].trim() && (
                <p className="mt-1 text-xs text-neutral-500">
                  {lang === "en" && values.pt.trim() ? "Usará o conteúdo em Português." : `Vazio = “${fallback.slice(0, 60)}${fallback.length > 60 ? "…" : ""}”`}
                </p>
              )
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function SeoForm({ initialValues: v }: { initialValues: SeoFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateSeoSettingsAction);
  const [title, setTitle] = useState({ pt: v.metaTitlePt, en: v.metaTitleEn });
  const [description, setDescription] = useState({ pt: v.metaDescriptionPt, en: v.metaDescriptionEn });
  const [ogImage, setOgImage] = useState<MediaValue | null>(v.ogImage);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  const previewTitle = title.pt.trim() || v.fallbackTitle;
  const previewDescription = description.pt.trim() || v.fallbackDescription;
  const host = v.siteUrl.replace(/^https?:\/\//, "");

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <form action={formAction} className="space-y-8">
        <Card title="Busca">
          <CountedPair
            label="Título (SEO)"
            name="metaTitle"
            values={title}
            onChange={setTitle}
            target={60}
            max={70}
            fallback={v.fallbackTitle}
            errors={{ pt: err("metaTitlePt"), en: err("metaTitleEn") }}
          />
          <CountedPair
            label="Meta descrição"
            name="metaDescription"
            values={description}
            onChange={setDescription}
            target={155}
            max={200}
            multiline
            fallback={v.fallbackDescription}
            errors={{ pt: err("metaDescriptionPt"), en: err("metaDescriptionEn") }}
          />
          <p className="text-xs text-neutral-500">O site é indexado no idioma padrão (Configurações → Site).</p>
        </Card>

        <Card title="Compartilhamento">
          <MediaField
            label="Imagem de compartilhamento (opcional)"
            name="ogImageId"
            category="seo"
            aspect="aspect-video"
            initial={v.ogImage}
            onChange={setOgImage}
            hint="1200×630 recomendado. Sem imagem, uma é gerada automaticamente com a marca."
            error={err("ogImageId")}
          />
          <TextField label="Twitter/X (opcional)" name="twitterHandle" placeholder="@usuario" defaultValue={v.twitterHandle} error={err("twitterHandle")} />
        </Card>

        <Card title="Indexação">
          <ToggleField
            label="Visível para o Google"
            name="robotsIndex"
            defaultChecked={v.robotsIndex}
            hint="Desativar isso pode fazer o site desaparecer do Google. Só desative se tiver certeza."
          />
        </Card>

        <FormFooter state={state} showSaved={showSaved} />
      </form>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card title="Prévia de busca (Google)">
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <p className="truncate text-xs text-neutral-500">{v.siteUrl}</p>
            <p className="truncate text-base text-blue-800">{previewTitle}</p>
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{previewDescription}</p>
          </div>
        </Card>
        <Card title="Prévia de compartilhamento">
          <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
            <div className="relative aspect-[1200/630] bg-neutral-100">
              {ogImage ? (
                <Image src={ogImage.url} alt="" fill sizes="400px" className="object-cover" unoptimized />
              ) : (
                <p className="flex h-full items-center justify-center text-xs text-neutral-400">Imagem gerada automaticamente</p>
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs uppercase text-neutral-400">{host}</p>
              <p className="truncate text-sm font-medium">{previewTitle}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

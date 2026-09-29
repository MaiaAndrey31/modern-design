"use client";

import { useState } from "react";
import Image from "next/image";
import { TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LinkField, LocalizedField, LocalizedLinesField, MediaField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateHeroAction } from "@/app/(admin)/admin/_actions/content";
import { parseYouTubeId } from "@/lib/youtube";
import type { NavigationItemTypeId } from "@/lib/navigation/registry";

export type HeroBackgroundType = "image" | "video" | "youtube";

const BACKGROUND_OPTIONS: { value: HeroBackgroundType; label: string }[] = [
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo (MP4)" },
  { value: "youtube", label: "YouTube" },
];

interface CtaValues {
  labelPt: string | null;
  labelEn: string | null;
  type: NavigationItemTypeId;
  target: string | null;
}

export interface HeroFormValues {
  headlineLinesPt: string[];
  headlineLinesEn: string[];
  background: MediaValue | null;
  video: MediaValue | null;
  poster: MediaValue | null;
  youtubeUrl: string;
  backgroundType: HeroBackgroundType;
  enableWebgl: boolean;
  foundedLabelPt: string | null;
  foundedLabelEn: string | null;
  primaryCta: CtaValues;
  secondaryCta: CtaValues;
}

export function HeroForm({ initialValues: v, brandName }: { initialValues: HeroFormValues; brandName: string }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateHeroAction);
  const [backgroundType, setBackgroundType] = useState<HeroBackgroundType>(v.backgroundType);
  const [youtubeUrl, setYoutubeUrl] = useState(v.youtubeUrl);
  const youtubeId = parseYouTubeId(youtubeUrl);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Fundo">
        <fieldset>
          <legend className="block text-sm font-medium text-neutral-700">Tipo de fundo</legend>
          <div className="mt-1.5 inline-flex rounded-md border border-neutral-300 p-0.5" role="radiogroup">
            {BACKGROUND_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 ${
                  backgroundType === option.value ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <input
                  type="radio"
                  name="backgroundType"
                  value={option.value}
                  checked={backgroundType === option.value}
                  onChange={() => setBackgroundType(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 md:grid-cols-2">
          <MediaField
            label={backgroundType === "image" ? "Imagem do Hero" : "Imagem de capa"}
            name="backgroundImageId"
            category="hero"
            initial={v.background}
            hint={backgroundType !== "image" ? "Exibida enquanto o vídeo carrega e para quem prefere menos movimento." : undefined}
            error={err("backgroundImageId")}
          />

          {/* Kept mounted (hidden) so switching type back and forth doesn't lose the choice. */}
          <div className={backgroundType === "video" ? "space-y-6" : "hidden"}>
            <MediaField
              label="Vídeo do Hero"
              name="videoId"
              category="hero"
              kind="video"
              initial={v.video}
              hint="MP4, até 50MB. Toca sem som e em loop — prefira clipes curtos (10–30s)."
              error={err("videoId")}
            />
            <MediaField label="Poster do vídeo (opcional)" name="posterImageId" category="hero" initial={v.poster} error={err("posterImageId")} />
          </div>

          <div className={backgroundType === "youtube" ? "" : "hidden"}>
            <TextField
              label="Link do vídeo no YouTube"
              name="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              error={err("youtubeUrl") ?? (youtubeUrl && !youtubeId ? "Link do YouTube não reconhecido." : undefined)}
            />
            {youtubeId && (
              <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md border border-neutral-200">
                <Image src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" fill sizes="320px" className="object-cover" unoptimized />
              </div>
            )}
            <p className="mt-1 text-xs text-neutral-500">Toca sem som, em loop e sem controles. Vídeos com restrição de incorporação não funcionam.</p>
          </div>
        </div>

        <ToggleField
          label="Efeito 3D no Hero (WebGL)"
          name="enableWebgl"
          defaultChecked={v.enableWebgl}
          hint="Efeito interativo sutil na imagem do Hero (desktop apenas). Não se aplica quando o fundo é vídeo."
        />
      </Card>

      <Card title="Textos">
        <LocalizedLinesField
          label="Título (uma linha por quebra)"
          name="headlineLines"
          hint={`Até 4 linhas. Vazio = nome da marca (“${brandName}”).`}
          rows={3}
          defaultPt={v.headlineLinesPt}
          defaultEn={v.headlineLinesEn}
          state={state}
        />
        <LocalizedField
          label="Rótulo antes do ano de início"
          name="foundedLabel"
          maxLength={24}
          placeholder="Desde"
          hint="Exibido como “Desde 1993”. O ano vem de Conteúdo → Perfil."
          defaultPt={v.foundedLabelPt}
          defaultEn={v.foundedLabelEn}
          state={state}
        />
      </Card>

      <Card title="Botões">
        <LinkField
          label="Botão principal"
          prefix="primaryCta"
          defaultType={v.primaryCta.type}
          defaultTarget={v.primaryCta.target}
          defaultLabelPt={v.primaryCta.labelPt}
          defaultLabelEn={v.primaryCta.labelEn}
          state={state}
        />
        <LinkField
          label="Botão secundário"
          prefix="secondaryCta"
          defaultType={v.secondaryCta.type}
          defaultTarget={v.secondaryCta.target}
          defaultLabelPt={v.secondaryCta.labelPt}
          defaultLabelEn={v.secondaryCta.labelEn}
          state={state}
        />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { TextField, ToggleField, SaveButton } from "@/components/admin/fields";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateHeroAction } from "@/app/(admin)/admin/_actions/homepage";
import { parseYouTubeId } from "@/lib/youtube";

export type HeroBackgroundType = "image" | "video" | "youtube";

const BACKGROUND_OPTIONS: { value: HeroBackgroundType; label: string }[] = [
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo (MP4)" },
  { value: "youtube", label: "YouTube" },
];

export interface HeroFormValues {
  headlineLine1?: string;
  headlineLine2?: string;
  eyebrowOverride?: string;
  primaryCtaLabel?: string;
  primaryCtaTarget?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTarget?: string;
  enableWebgl?: boolean;
  background?: MediaValue | null;
  backgroundType?: HeroBackgroundType;
  video?: MediaValue | null;
  youtubeUrl?: string;
}

export function HeroForm({ initialValues }: { initialValues: HeroFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateHeroAction);
  const [background, setBackground] = useState<MediaValue | null>(initialValues.background ?? null);
  const [backgroundType, setBackgroundType] = useState<HeroBackgroundType>(initialValues.backgroundType ?? "image");
  const [video, setVideo] = useState<MediaValue | null>(initialValues.video ?? null);
  const [youtubeUrl, setYoutubeUrl] = useState(initialValues.youtubeUrl ?? "");
  const youtubeId = parseYouTubeId(youtubeUrl);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <fieldset>
        <legend className="block text-sm font-medium text-neutral-700">Fundo do Hero</legend>
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

      {backgroundType === "video" && (
        <div>
          <MediaPickerField label="Vídeo do Hero" folder="hero" kind="video" aspect="aspect-video" value={video} onChange={setVideo} required />
          <p className="mt-1 text-xs text-neutral-500">MP4, até 50MB. O vídeo toca sem som e em loop — prefira clipes curtos (10–30s).</p>
          {state.fieldErrors?.videoId?.[0] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.videoId[0]}</p>}
        </div>
      )}
      <input type="hidden" name="videoId" value={video?.id ?? ""} />

      {backgroundType === "youtube" && (
        <div>
          <TextField
            label="Link do vídeo no YouTube"
            name="youtubeUrl"
            required
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            error={state.fieldErrors?.youtubeUrl?.[0] ?? (youtubeUrl && !youtubeId ? "Link do YouTube não reconhecido." : undefined)}
          />
          {youtubeId && (
            <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md border border-neutral-200">
              <Image src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" fill sizes="320px" className="object-cover" unoptimized />
            </div>
          )}
          <p className="mt-1 text-xs text-neutral-500">O vídeo toca sem som, em loop e sem controles. Vídeos com restrição de incorporação não funcionam.</p>
        </div>
      )}
      {backgroundType !== "youtube" && <input type="hidden" name="youtubeUrl" value={youtubeUrl} />}

      <div>
        <MediaPickerField
          label={backgroundType === "image" ? "Imagem do Hero" : "Imagem de capa"}
          folder="hero"
          aspect="aspect-video"
          value={background}
          onChange={setBackground}
          required
        />
        {backgroundType !== "image" && (
          <p className="mt-1 text-xs text-neutral-500">
            Exibida enquanto o vídeo carrega e para quem prefere menos movimento.
          </p>
        )}
      </div>
      <input type="hidden" name="backgroundImageId" value={background?.id ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Título — linha 1" name="headlineLine1" required defaultValue={initialValues.headlineLine1} error={state.fieldErrors?.headlineLine1?.[0]} />
        <TextField label="Título — linha 2" name="headlineLine2" required defaultValue={initialValues.headlineLine2} error={state.fieldErrors?.headlineLine2?.[0]} />
      </div>

      <TextField
        label="Funções exibidas (opcional)"
        name="eyebrowOverride"
        defaultValue={initialValues.eyebrowOverride}
        placeholder="Ex.: DJ · Producer · Entertainer"
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Texto do CTA principal" name="primaryCtaLabel" required defaultValue={initialValues.primaryCtaLabel ?? "Explore"} />
        <TextField label="Destino do CTA principal" name="primaryCtaTarget" required defaultValue={initialValues.primaryCtaTarget ?? "story"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Texto do CTA secundário" name="secondaryCtaLabel" required defaultValue={initialValues.secondaryCtaLabel ?? "Booking"} />
        <TextField label="Destino do CTA secundário" name="secondaryCtaTarget" required defaultValue={initialValues.secondaryCtaTarget ?? "booking"} />
      </div>

      <ToggleField
        label="Efeito 3D no Hero (WebGL)"
        name="enableWebgl"
        defaultChecked={initialValues.enableWebgl ?? true}
        hint="Desative para remover o efeito interativo sutil na foto do Hero (desktop apenas). Não se aplica quando o fundo é vídeo."
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <SaveButton />
        {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
      </div>
    </form>
  );
}

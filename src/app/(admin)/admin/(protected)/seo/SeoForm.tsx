"use client";

import { useState } from "react";
import Image from "next/image";
import { TextField, ToggleField, SaveButton } from "@/components/admin/fields";
import { MediaPickerField, type MediaValue } from "@/components/admin/MediaPickerField";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateSeoSettingsAction } from "@/app/(admin)/admin/_actions/seo";

export interface SeoFormValues {
  metaTitle?: string;
  metaDescription?: string;
  twitterHandle?: string;
  robotsIndex?: boolean;
  ogImage?: MediaValue | null;
  artistName: string;
  siteUrl: string;
}

function CharCounter({ value, target, max }: { value: string; target: number; max: number }) {
  const len = value.length;
  const color = len <= target ? "text-green-600" : len <= max ? "text-amber-600" : "text-red-600";
  return (
    <span className={`text-xs ${color}`}>
      {len}/{max}
    </span>
  );
}

export function SeoForm({ initialValues }: { initialValues: SeoFormValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateSeoSettingsAction);
  const [title, setTitle] = useState(initialValues.metaTitle ?? "");
  const [description, setDescription] = useState(initialValues.metaDescription ?? "");
  const [ogImage, setOgImage] = useState<MediaValue | null>(initialValues.ogImage ?? null);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <form action={formAction} className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="metaTitle" className="block text-sm font-medium text-neutral-700">
              Título (SEO)
            </label>
            <CharCounter value={title} target={60} max={70} />
          </div>
          <input
            id="metaTitle"
            name="metaTitle"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none focus:border-neutral-900"
          />
          {state.fieldErrors?.metaTitle?.[0] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.metaTitle[0]}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="metaDescription" className="block text-sm font-medium text-neutral-700">
              Meta descrição
            </label>
            <CharCounter value={description} target={155} max={200} />
          </div>
          <textarea
            id="metaDescription"
            name="metaDescription"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none focus:border-neutral-900"
          />
          {state.fieldErrors?.metaDescription?.[0] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.metaDescription[0]}</p>}
        </div>

        <MediaPickerField label="Imagem de compartilhamento (opcional)" folder="general" aspect="aspect-video" value={ogImage} onChange={setOgImage} />
        <input type="hidden" name="ogImageId" value={ogImage?.id ?? ""} />
        <p className="text-xs text-neutral-500">Se não definida, uma imagem é gerada automaticamente a partir da Identidade.</p>

        <TextField label="Twitter/X (opcional)" name="twitterHandle" placeholder="@alansaher" defaultValue={initialValues.twitterHandle} />

        <ToggleField
          label="Visível para o Google"
          name="robotsIndex"
          defaultChecked={initialValues.robotsIndex ?? true}
          hint="Desativar isso pode fazer seu site desaparecer do Google. Só desative se tiver certeza."
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center gap-4">
          <SaveButton />
          {showSaved && <span className="text-sm text-green-600">Alterações salvas.</span>}
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-neutral-700">Prévia de busca (Google)</p>
        <div className="mt-2 rounded-md border border-neutral-200 bg-white p-4">
          <p className="truncate text-xs text-neutral-500">{initialValues.siteUrl}</p>
          <p className="truncate text-base text-blue-800">{title || initialValues.artistName}</p>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{description}</p>
        </div>

        <p className="mt-6 text-sm font-medium text-neutral-700">Prévia de compartilhamento</p>
        <div className="mt-2 overflow-hidden rounded-md border border-neutral-200 bg-white">
          <div className="relative aspect-video bg-neutral-100">
            {ogImage && <Image src={ogImage.url} alt="" fill sizes="400px" className="object-cover" unoptimized />}
          </div>
          <div className="p-3">
            <p className="truncate text-xs uppercase text-neutral-400">{initialValues.siteUrl.replace(/^https?:\/\//, "")}</p>
            <p className="truncate text-sm font-medium">{title || initialValues.artistName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

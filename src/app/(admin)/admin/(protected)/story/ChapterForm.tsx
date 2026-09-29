"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SelectField, TextField, ToggleField, inputClass } from "@/components/admin/fields";
import { FormFooter, LocalizedField, MediaField } from "@/components/admin/form";
import { Card, Notice } from "@/components/admin/ui";
import type { MediaValue } from "@/components/admin/MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";
import { STORY_LIMITS, STORY_PLACE_ROLE_LABELS, STORY_VISUAL_LABELS, STORY_VISUAL_TYPES, type StoryVisualType } from "@/lib/story/registry";

export interface PlaceOption {
  id: string;
  name: string;
  /** Can frame the camera (has cameraWidthDeg). */
  canFrame: boolean;
  coords: string;
}

export interface ChapterValues {
  periodLabelPt: string;
  periodLabelEn: string | null;
  axisLabel: string | null;
  ghostLabelPt: string | null;
  ghostLabelEn: string | null;
  conceptPt: string;
  conceptEn: string | null;
  titlePt: string;
  titleEn: string | null;
  placeLabelPt: string | null;
  placeLabelEn: string | null;
  textPt: string;
  textEn: string | null;
  pullQuotePt: string | null;
  pullQuoteEn: string | null;
  visualType: StoryVisualType;
  image: MediaValue | null;
  allowPhoto: boolean;
  showRings: boolean;
  startsGlobalAct: boolean;
  scrollWeight: number;
  published: boolean;
  cameraPlaceIds: string[];
  labelPlaceIds: string[];
  pulsePlaceId: string | null;
  routeFromPlaceId: string | null;
  routeToPlaceId: string | null;
}

const { min: WMIN, max: WMAX } = STORY_LIMITS.scrollWeight;

function CameraSequence({ places, initial, error }: { places: PlaceOption[]; initial: string[]; error?: string }) {
  const [ids, setIds] = useState(initial);
  const [adding, setAdding] = useState("");
  const framable = places.filter((p) => p.canFrame);
  const name = (id: string) => places.find((p) => p.id === id)?.name ?? "(lugar removido)";
  const move = (from: number, to: number) =>
    setIds((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-neutral-700">{STORY_PLACE_ROLE_LABELS.CAMERA}</legend>
      <p className="mt-1 text-xs text-neutral-500">Sequência de enquadramentos tocada em ordem (ex.: país → estado → cidade). O último é o enquadramento final.</p>
      {ids.length > 0 && (
        <ol className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200">
          {ids.map((id, i) => (
            <li key={`${id}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-5 text-xs tabular-nums text-neutral-400">{i + 1}</span>
              <span className="flex-1">{name(id)}</span>
              <input type="hidden" name="cameraPlaceIds" value={id} />
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover para cima" className="text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-20">
                ▲
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === ids.length - 1} aria-label="Mover para baixo" className="text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-20">
                ▼
              </button>
              <button type="button" onClick={() => setIds((list) => list.filter((_, j) => j !== i))} className="text-xs text-red-600 hover:text-red-800">
                Remover
              </button>
            </li>
          ))}
        </ol>
      )}
      {ids.length < 4 && (
        <div className="mt-2 flex gap-2">
          <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Adicionar enquadramento" className={`${inputClass} mt-0`}>
            <option value="">Adicionar enquadramento…</option>
            {framable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!adding}
            onClick={() => {
              setIds((list) => [...list, adding]);
              setAdding("");
            }}
            className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      )}
      {framable.length === 0 && <p className="mt-2 text-xs text-amber-700">Nenhum lugar com largura de enquadramento cadastrado.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

function PlaceSelect({ label, name, places, defaultValue, error }: { label: string; name: string; places: PlaceOption[]; defaultValue: string | null; error?: string }) {
  return (
    <SelectField label={label} name={name} defaultValue={defaultValue ?? ""} error={error}>
      <option value="">Nenhum</option>
      {places.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </SelectField>
  );
}

export function ChapterForm({
  initial,
  places,
  action,
}: {
  initial: ChapterValues;
  places: PlaceOption[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [weight, setWeight] = useState(initial.scrollWeight);
  const [visual, setVisual] = useState<StoryVisualType>(initial.visualType);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Período e textos">
        <div className="grid gap-5 md:grid-cols-2">
          <LocalizedField label="Período" name="periodLabel" required maxLength={24} placeholder="1995–2000" defaultPt={initial.periodLabelPt} defaultEn={initial.periodLabelEn} state={state} />
          <LocalizedField
            label="Ano gigante de fundo (opcional)"
            name="ghostLabel"
            maxLength={8}
            hint="Vazio = 4 primeiros caracteres do período."
            defaultPt={initial.ghostLabelPt}
            defaultEn={initial.ghostLabelEn}
            state={state}
          />
        </div>
        <TextField
          label="Rótulo no eixo de progresso (opcional)"
          name="axisLabel"
          maxLength={12}
          defaultValue={initial.axisLabel ?? ""}
          error={err("axisLabel")}
        />
        <p className="-mt-3 text-xs text-neutral-500">Vazio = apenas um ponto no eixo.</p>
        <LocalizedField label="Conceito" name="concept" required maxLength={40} placeholder="Origem" defaultPt={initial.conceptPt} defaultEn={initial.conceptEn} state={state} />
        <LocalizedField label="Título" name="title" required maxLength={120} defaultPt={initial.titlePt} defaultEn={initial.titleEn} state={state} />
        <LocalizedField label="Local exibido (opcional)" name="placeLabel" maxLength={120} placeholder="Cidade, Estado" defaultPt={initial.placeLabelPt} defaultEn={initial.placeLabelEn} state={state} />
        <LocalizedField label="Texto" name="text" required multiline rows={6} maxLength={1200} defaultPt={initial.textPt} defaultEn={initial.textEn} state={state} />
        <LocalizedField
          label="Frase em destaque (opcional)"
          name="pullQuote"
          maxLength={160}
          hint="Exibida maior no visual “Frase em destaque”. Duas frases separadas por ponto viram duas linhas."
          defaultPt={initial.pullQuotePt}
          defaultEn={initial.pullQuoteEn}
          state={state}
        />
      </Card>

      <Card title="Visual">
        <SelectField label="Tipo de visual" name="visualType" value={visual} onChange={(e) => setVisual(e.target.value as StoryVisualType)} error={err("visualType")}>
          {STORY_VISUAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {STORY_VISUAL_LABELS[t]}
            </option>
          ))}
        </SelectField>
        <MediaField
          label="Fotografia (opcional)"
          name="imageId"
          category="story"
          aspect="aspect-[4/5]"
          initial={initial.image}
          hint={visual === "photo" ? "Usada pelo visual Fotografia." : "Usada quando o capítulo mostra foto."}
          error={err("imageId")}
        />
        <ToggleField label="Permitir fotografia" name="allowPhoto" defaultChecked={initial.allowPhoto} hint="Desative em capítulos de época sem fotos reais — o capítulo nunca mostrará imagem." />
        <ToggleField label="Anéis ao redor da origem" name="showRings" defaultChecked={initial.showRings} hint="Sugere “muitas cidades” sem nomeá-las (visual Mapa)." />
      </Card>

      <Card title="Mapa" description="Lugares cadastrados em Conteúdo → Lugares.">
        {places.length === 0 ? (
          <Notice tone="warning">
            Nenhum lugar cadastrado.{" "}
            <Link href="/admin/places/new" className="underline">
              Cadastrar lugar
            </Link>
          </Notice>
        ) : (
          <>
            <CameraSequence places={places} initial={initial.cameraPlaceIds} error={err("places.cameraPlaceIds")} />
            <fieldset>
              <legend className="block text-sm font-medium text-neutral-700">{STORY_PLACE_ROLE_LABELS.LABEL}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {places.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="labelPlaceIds" value={p.id} defaultChecked={initial.labelPlaceIds.includes(p.id)} className="h-4 w-4 accent-neutral-900" />
                    {p.name}
                  </label>
                ))}
              </div>
              {err("places.labelPlaceIds") && <p className="mt-1 text-xs text-red-600">{err("places.labelPlaceIds")}</p>}
            </fieldset>
            <div className="grid gap-4 md:grid-cols-3">
              <PlaceSelect label={STORY_PLACE_ROLE_LABELS.PULSE} name="pulsePlaceId" places={places} defaultValue={initial.pulsePlaceId} />
              <PlaceSelect label={STORY_PLACE_ROLE_LABELS.ROUTE_FROM} name="routeFromPlaceId" places={places} defaultValue={initial.routeFromPlaceId} />
              <PlaceSelect
                label={STORY_PLACE_ROLE_LABELS.ROUTE_TO}
                name="routeToPlaceId"
                places={places}
                defaultValue={initial.routeToPlaceId}
                error={err("places.routeToPlaceId")}
              />
            </div>
          </>
        )}
      </Card>

      <Card title="Ritmo e publicação">
        <div>
          <label htmlFor="scrollWeight" className="block text-sm font-medium text-neutral-700">
            Duração no scroll: <span className="tabular-nums">{weight.toFixed(2)}×</span>
          </label>
          <input
            id="scrollWeight"
            name="scrollWeight"
            type="range"
            min={WMIN}
            max={WMAX}
            step={0.05}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="mt-2 w-full max-w-md accent-neutral-900"
          />
          <p className="text-xs text-neutral-500">
            1× = padrão. Entre {WMIN}× e {WMAX}× para manter o ritmo da animação.
          </p>
        </div>
        <ToggleField
          label="Início do ato global"
          name="startsGlobalAct"
          defaultChecked={initial.startsGlobalAct}
          hint="O interlúdio da tese é tocado antes deste capítulo. Só um capítulo pode ter esta marcação — marcar aqui desmarca o anterior."
        />
        <ToggleField label="Publicado" name="published" defaultChecked={initial.published} />
      </Card>

      <FormFooter
        state={state}
        label="Salvar capítulo"
        extra={
          <Link href="/admin/story" className="text-sm text-neutral-500 hover:text-neutral-900">
            Cancelar
          </Link>
        }
      />
    </form>
  );
}

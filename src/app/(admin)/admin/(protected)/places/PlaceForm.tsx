"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SelectField, TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LocalizedField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import type { ActionState } from "@/lib/validations/admin/actionState";
import { LABEL_POSITIONS, LABEL_POSITION_LABELS, STORY_LIMITS, type LabelPosition } from "@/lib/story/registry";

export interface PlaceValues {
  namePt: string;
  nameEn: string | null;
  latitude: number | "";
  longitude: number | "";
  labelPosition: LabelPosition;
  cameraWidthDeg: number | null;
  isOrigin: boolean;
  showOnGlobe: boolean;
  globeOrder: number | null;
}

const L = STORY_LIMITS;

export function PlaceForm({ initial, action }: { initial: PlaceValues; action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [lat, setLat] = useState(String(initial.latitude));
  const [lon, setLon] = useState(String(initial.longitude));
  const [onGlobe, setOnGlobe] = useState(initial.showOnGlobe);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];
  const valid = lat !== "" && lon !== "" && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180;

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      <Card title="Identificação">
        <LocalizedField label="Nome" name="name" required maxLength={80} defaultPt={initial.namePt} defaultEn={initial.nameEn} state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={`Latitude (${L.latitude.min} a ${L.latitude.max})`}
            name="latitude"
            type="number"
            step="any"
            min={L.latitude.min}
            max={L.latitude.max}
            required
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            error={err("latitude")}
          />
          <TextField
            label={`Longitude (${L.longitude.min} a ${L.longitude.max})`}
            name="longitude"
            type="number"
            step="any"
            min={L.longitude.min}
            max={L.longitude.max}
            required
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            error={err("longitude")}
          />
        </div>
        {valid && (
          <p className="text-xs text-neutral-500">
            Conferir no mapa:{" "}
            <a
              href={`https://www.openstreetmap.org/?mlat=${Number(lat)}&mlon=${Number(lon)}#map=8/${Number(lat)}/${Number(lon)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              OpenStreetMap ↗
            </a>{" "}
            · Latitude negativa = Sul, longitude negativa = Oeste.
          </p>
        )}
      </Card>

      <Card title="Mapa da História">
        <SelectField label="Posição do rótulo" name="labelPosition" defaultValue={initial.labelPosition} error={err("labelPosition")}>
          {LABEL_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {LABEL_POSITION_LABELS[p]}
            </option>
          ))}
        </SelectField>
        <TextField
          label={`Largura de enquadramento em graus (opcional, ${L.cameraWidthDeg.min}–${L.cameraWidthDeg.max})`}
          name="cameraWidthDeg"
          type="number"
          step="any"
          min={L.cameraWidthDeg.min}
          max={L.cameraWidthDeg.max}
          defaultValue={initial.cameraWidthDeg ?? ""}
          error={err("cameraWidthDeg")}
        />
        <p className="text-xs text-neutral-500">Preencha para usar este lugar como câmera do mapa. Vazio = só ponto/rótulo/rota.</p>
      </Card>

      <Card title="Globo">
        <ToggleField label="Origem da jornada" name="isOrigin" defaultChecked={initial.isOrigin} hint="As rotas do globo partem daqui. Só um lugar pode ser a origem — marcar aqui desmarca o anterior." />
        <label className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3">
          <span className="text-sm font-medium text-neutral-800">Destino no globo</span>
          <input type="checkbox" name="showOnGlobe" checked={onGlobe} onChange={(e) => setOnGlobe(e.target.checked)} className="h-5 w-5 accent-neutral-900" />
        </label>
        {onGlobe && (
          <TextField
            label="Ordem no globo (0–100)"
            name="globeOrder"
            type="number"
            min={0}
            max={100}
            defaultValue={initial.globeOrder ?? ""}
            error={err("globeOrder")}
          />
        )}
      </Card>

      <FormFooter
        state={state}
        label="Salvar lugar"
        extra={
          <Link href="/admin/places" className="text-sm text-neutral-500 hover:text-neutral-900">
            Cancelar
          </Link>
        }
      />
    </form>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { SaveButton, inputClass } from "./fields";
import { MediaPickerField, type MediaValue } from "./MediaPickerField";
import type { ActionState } from "@/lib/validations/admin/actionState";
import type { UploadKind } from "@/lib/uploadFile";
import { SECTION_KEYS, SECTION_REGISTRY } from "@/lib/sections/registry";
import { NAVIGATION_ITEM_TYPE_LABELS, type NavigationItemTypeId } from "@/lib/navigation/registry";
import { HEX_COLOR_PATTERN } from "@/lib/theme/registry";

const labelCls = "block text-sm font-medium text-neutral-700";
const subLabelCls = "block text-[11px] font-medium uppercase tracking-wider text-neutral-400";
const errorCls = "mt-1 text-xs text-red-600";
const hintCls = "mt-1 text-xs text-neutral-500";

const err = (state: ActionState | undefined, key: string) => state?.fieldErrors?.[key]?.[0];

// ---------------------------------------------------------------------------
// PT / EN
// ---------------------------------------------------------------------------

interface LocalizedFieldProps {
  label: string;
  /** Base name: renders `${name}Pt` and `${name}En`. */
  name: string;
  defaultPt?: string | null;
  defaultEn?: string | null;
  multiline?: boolean;
  rows?: number;
  /** PT required (EN is always optional). */
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  hint?: ReactNode;
  state?: ActionState;
  /** Error keys when the field sits inside a nested schema object (e.g. "cta.labelPt"). */
  errorKeyPt?: string;
  errorKeyEn?: string;
}

/**
 * One editorial text in both languages. PT is the source; an empty EN shows
 * a reminder that the site will fall back to the Portuguese copy.
 */
export function LocalizedField({
  label,
  name,
  defaultPt,
  defaultEn,
  multiline,
  rows = 3,
  required,
  maxLength,
  placeholder,
  hint,
  state,
  errorKeyPt = `${name}Pt`,
  errorKeyEn = `${name}En`,
}: LocalizedFieldProps) {
  const id = useId();
  const [en, setEn] = useState(defaultEn ?? "");
  const Control = multiline ? "textarea" : "input";
  const common = { className: inputClass, maxLength, placeholder, ...(multiline ? { rows } : { type: "text" }) };

  return (
    <fieldset>
      <legend className={labelCls}>
        {label} {required && <span aria-hidden="true">*</span>}
      </legend>
      {hint && <p className={hintCls}>{hint}</p>}
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-pt`} className={subLabelCls}>
            Português
          </label>
          <Control id={`${id}-pt`} name={`${name}Pt`} defaultValue={defaultPt ?? ""} required={required} {...common} />
          {err(state, errorKeyPt) && <p className={errorCls}>{err(state, errorKeyPt)}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-en`} className={subLabelCls}>
            English
          </label>
          <Control id={`${id}-en`} name={`${name}En`} value={en} onChange={(e) => setEn(e.target.value)} {...common} />
          {err(state, errorKeyEn) ? (
            <p className={errorCls}>{err(state, errorKeyEn)}</p>
          ) : (
            en.trim() === "" && <p className={hintCls}>Usará o conteúdo em Português.</p>
          )}
        </div>
      </div>
    </fieldset>
  );
}

/** A list (String[]) in both languages — one item per line. */
export function LocalizedLinesField(props: Omit<LocalizedFieldProps, "multiline" | "defaultPt" | "defaultEn"> & {
  defaultPt?: readonly string[] | null;
  defaultEn?: readonly string[] | null;
}) {
  return (
    <LocalizedField
      {...props}
      multiline
      rows={props.rows ?? 4}
      defaultPt={(props.defaultPt ?? []).join("\n")}
      defaultEn={(props.defaultEn ?? []).join("\n")}
      hint={props.hint ?? "Uma linha por item."}
    />
  );
}

// ---------------------------------------------------------------------------
// Links — (type, target) with a dedicated control per type
// ---------------------------------------------------------------------------

const NAVIGABLE_SECTIONS = SECTION_KEYS.filter((key) => SECTION_REGISTRY[key].anchor);

interface LinkFieldProps {
  label: string;
  /** Renders `${prefix}Type`, `${prefix}Target` (+ `${prefix}LabelPt/En` when withLabel). */
  prefix: string;
  defaultType?: NavigationItemTypeId | null;
  defaultTarget?: string | null;
  defaultLabelPt?: string | null;
  defaultLabelEn?: string | null;
  withLabel?: boolean;
  /** Offer "Sem link" (the link is removed when chosen). */
  optional?: boolean;
  state?: ActionState;
  /** Zod path of the link object, e.g. "cta" → errors at "cta.target". Empty = flat keys. */
  errorPath?: string;
}

export function LinkField({
  label,
  prefix,
  defaultType,
  defaultTarget,
  defaultLabelPt,
  defaultLabelEn,
  withLabel = true,
  optional = true,
  state,
  errorPath = prefix,
}: LinkFieldProps) {
  const id = useId();
  const [type, setType] = useState<NavigationItemTypeId | "">(defaultType ?? (optional ? "" : "SECTION"));
  // One remembered target per type, so switching type and back doesn't lose input.
  const [targets, setTargets] = useState<Record<NavigationItemTypeId, string>>({
    SECTION: defaultType === "SECTION" ? defaultTarget ?? "" : "",
    ROUTE: defaultType === "ROUTE" ? defaultTarget ?? "" : "",
    EXTERNAL: defaultType === "EXTERNAL" ? defaultTarget ?? "" : "",
  });
  const target = type ? targets[type] : "";
  const setTarget = (value: string) => type && setTargets((t) => ({ ...t, [type]: value }));
  const key = (field: string) => (errorPath ? `${errorPath}.${field}` : field);

  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-200 p-4">
      <legend className="px-1 text-sm font-medium text-neutral-700">{label}</legend>

      {withLabel && (
        <LocalizedField
          label="Texto"
          name={`${prefix}Label`}
          defaultPt={defaultLabelPt}
          defaultEn={defaultLabelEn}
          maxLength={80}
          state={state}
          errorKeyPt={key("labelPt")}
          errorKeyEn={key("labelEn")}
        />
      )}

      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <div>
          <label htmlFor={`${id}-type`} className={subLabelCls}>
            Tipo
          </label>
          <select
            id={`${id}-type`}
            name={`${prefix}Type`}
            value={type}
            onChange={(e) => setType(e.target.value as NavigationItemTypeId | "")}
            className={inputClass}
          >
            {optional && <option value="">Sem link</option>}
            {(Object.keys(NAVIGATION_ITEM_TYPE_LABELS) as NavigationItemTypeId[]).map((t) => (
              <option key={t} value={t}>
                {NAVIGATION_ITEM_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {err(state, key("type")) && <p className={errorCls}>{err(state, key("type"))}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-target`} className={subLabelCls}>
            Destino
          </label>
          {type === "SECTION" && (
            <select id={`${id}-target`} value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              <option value="">Escolha a seção…</option>
              {NAVIGABLE_SECTIONS.map((k) => (
                <option key={k} value={k}>
                  {SECTION_REGISTRY[k].label}
                </option>
              ))}
            </select>
          )}
          {type === "ROUTE" && (
            <input
              id={`${id}-target`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/contato"
              className={inputClass}
            />
          )}
          {type === "EXTERNAL" && (
            <input
              id={`${id}-target`}
              type="url"
              inputMode="url"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          )}
          {type === "" && <p className="mt-2.5 text-sm text-neutral-400">Nenhum link — o botão não aparece no site.</p>}
          <input type="hidden" name={`${prefix}Target`} value={target} />
          {type === "ROUTE" && <p className={hintCls}>Página interna, começando com /.</p>}
          {type === "EXTERNAL" && <p className={hintCls}>Somente links https://, mailto: ou tel:.</p>}
          {err(state, key("target")) && <p className={errorCls}>{err(state, key("target"))}</p>}
        </div>
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Colour (controlled — the Colors screen drives a live preview)
// ---------------------------------------------------------------------------

export function ColorField({
  label,
  name,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const valid = HEX_COLOR_PATTERN.test(draft);

  const commit = (next: string) => {
    setDraft(next);
    if (HEX_COLOR_PATTERN.test(next)) onChange(next.toUpperCase());
  };

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — seletor`}
          value={HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : "#000000"}
          onChange={(e) => commit(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-neutral-300 bg-white p-1"
        />
        <input
          id={id}
          name={name}
          value={draft}
          onChange={(e) => commit(e.target.value.trim())}
          spellCheck={false}
          maxLength={7}
          className={`${inputClass} mt-0 font-mono uppercase ${valid ? "" : "border-red-400"}`}
        />
      </div>
      {!valid && <p className={errorCls}>Use o formato #RRGGBB.</p>}
      {error && <p className={errorCls}>{error}</p>}
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media (MediaPickerField + hidden id input)
// ---------------------------------------------------------------------------

export function MediaField({
  label,
  name,
  category,
  initial,
  kind = "image",
  aspect = "aspect-video",
  required,
  hint,
  error,
  onChange,
}: {
  label: string;
  name: string;
  /** Media category the picker opens on / uploads into. */
  category: string;
  initial?: MediaValue | null;
  kind?: UploadKind;
  aspect?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  onChange?: (value: MediaValue | null) => void;
}) {
  const [value, setValue] = useState<MediaValue | null>(initial ?? null);
  return (
    <div>
      <MediaPickerField
        label={label}
        folder={category}
        kind={kind}
        aspect={aspect}
        required={required}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
      <input type="hidden" name={name} value={value?.id ?? ""} />
      {hint && <p className={hintCls}>{hint}</p>}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submit row
// ---------------------------------------------------------------------------

export function FormFooter({
  state,
  showSaved,
  label,
  extra,
}: {
  state: ActionState;
  showSaved?: boolean;
  label?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-16 z-10 -mx-1 flex flex-wrap items-center gap-4 rounded-md bg-neutral-50/95 px-1 py-3 backdrop-blur lg:bottom-0">
      <SaveButton>{label}</SaveButton>
      {extra}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {showSaved && (
        <p role="status" className="text-sm text-green-600">
          Alterações salvas.
        </p>
      )}
    </div>
  );
}

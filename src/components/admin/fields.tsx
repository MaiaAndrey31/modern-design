"use client";

import { useFormStatus } from "react-dom";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const inputClass =
  "mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

export function TextField({
  label,
  name,
  error,
  required,
  ...rest
}: { label: string; name: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} required={required} className={inputClass} {...rest} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  required,
  rows = 4,
  ...rest
}: { label: string; name: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name} required={required} rows={rows} className={inputClass} {...rest} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  required,
  children,
  ...rest
}: { label: string; name: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <select id={name} name={name} required={required} className={inputClass} {...rest}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ToggleField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-neutral-800">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-neutral-900" />
    </label>
  );
}

export function SaveButton({ children = "Salvar alterações" }: { children?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Salvando…" : children}
    </button>
  );
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
        status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
      }`}
    >
      {status === "PUBLISHED" ? "Publicado" : "Rascunho"}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { SortableList } from "@/components/admin/SortableList";
import { reorderSectionsAction, setSectionEnabledAction } from "@/app/(admin)/admin/_actions/sections";

export interface SectionRow {
  id: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
  fixed: boolean;
  toggleable: boolean;
  editHref: string;
}

function EnabledSwitch({ row }: { row: SectionRow }) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!row.toggleable) return <span className="text-xs text-neutral-400">Sempre ativa</span>;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setSectionEnabledAction(row.id, next);
      if (!result.ok) {
        setEnabled(!next);
        setError(result.error ?? "Não foi possível salvar.");
      }
    });
  };

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${row.label}: ${enabled ? "ativa" : "desativada"}`}
        onClick={toggle}
        disabled={isPending}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${enabled ? "bg-neutral-900" : "bg-neutral-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </span>
  );
}

function RowBody({ row }: { row: SectionRow }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-900">{row.label}</span>
        <Link href={row.editHref} className="text-xs text-neutral-500 underline hover:text-neutral-900">
          Editar conteúdo
        </Link>
      </div>
      <EnabledSwitch row={row} />
    </div>
  );
}

export function SectionsManager({ fixed, flow }: { fixed: SectionRow[]; flow: SectionRow[] }) {
  return (
    <div className="space-y-3">
      <ul className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {fixed.map((row) => (
          <li key={row.id} className="px-3 py-3 pl-12">
            <RowBody row={row} />
            <p className="mt-1 text-xs text-neutral-500">Fixa no topo — não pode ser movida nem desativada.</p>
          </li>
        ))}
      </ul>
      <SortableList
        label="Ordem das seções"
        items={flow}
        onReorder={(ids) => reorderSectionsAction(ids)}
        renderItem={(row) => <RowBody row={row} />}
      />
      <p className="text-xs text-neutral-500">O Footer não entra na ordenação: aparece sempre no fim da página.</p>
    </div>
  );
}

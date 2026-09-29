"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { SortableList } from "@/components/admin/SortableList";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { EmptyState } from "@/components/admin/ui";
import {
  deleteNavigationItemAction,
  reorderNavigationItemsAction,
  setNavigationItemEnabledAction,
} from "@/app/(admin)/admin/_actions/navigation";

export interface MenuRow {
  id: string;
  label: string;
  labelEn: string | null;
  target: string;
  enabled: boolean;
  openInNewTab: boolean;
}

function EnabledCheckbox({ row }: { row: MenuRow }) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [isPending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-1.5 text-xs text-neutral-600">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          startTransition(async () => {
            const result = await setNavigationItemEnabledAction(row.id, next);
            if (!result.ok) setEnabled(!next);
          });
        }}
        className="h-4 w-4 accent-neutral-900"
      />
      Ativo
    </label>
  );
}

export function MenuGroup({ location, rows }: { location: string; rows: MenuRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState>
        Nenhum link neste grupo.{" "}
        <Link href={`/admin/menus/new?location=${location}`} className="underline">
          Adicionar
        </Link>
      </EmptyState>
    );
  }

  return (
    <SortableList
      label="Links do menu"
      items={rows}
      onReorder={(ids) => reorderNavigationItemsAction(location, ids)}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`truncate text-sm font-medium ${row.enabled ? "text-neutral-900" : "text-neutral-400 line-through"}`}>
              {row.label}
              {row.labelEn && <span className="ml-2 font-normal text-neutral-400">/ {row.labelEn}</span>}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {row.target}
              {row.openInNewTab && " · nova aba"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <EnabledCheckbox row={row} />
            <Link href={`/admin/menus/${row.id}`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
              Editar
            </Link>
            <DeleteButton action={deleteNavigationItemAction.bind(null, row.id)} confirmMessage={`Excluir o link "${row.label}"?`} />
          </div>
        </div>
      )}
    />
  );
}

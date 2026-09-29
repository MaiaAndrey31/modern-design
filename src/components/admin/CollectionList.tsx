"use client";

import Image from "next/image";
import Link from "next/link";
import { SortableList } from "./SortableList";
import { DeleteButton } from "./DeleteButton";
import { StatusBadge } from "./fields";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface CollectionRow {
  id: string;
  title: string;
  meta?: string;
  imageUrl?: string | null;
  status?: "DRAFT" | "PUBLISHED";
  editHref: string;
}

/** Standard sortable admin list: thumbnail · title/meta · status · edit · delete. */
export function CollectionList({
  label,
  rows,
  reorder,
  remove,
}: {
  label: string;
  rows: CollectionRow[];
  reorder: (ids: string[]) => Promise<ActionState>;
  remove: (id: string) => Promise<ActionState | { ok: boolean; error?: string; usedIn?: string[] }>;
}) {
  return (
    <SortableList
      label={label}
      items={rows}
      onReorder={reorder}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center gap-3">
          {row.imageUrl !== undefined && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
              {row.imageUrl && <Image src={row.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.title}</p>
            {row.meta && <p className="truncate text-xs text-neutral-500">{row.meta}</p>}
          </div>
          {row.status && <StatusBadge status={row.status} />}
          <Link href={row.editHref} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
            Editar
          </Link>
          <DeleteButton action={remove.bind(null, row.id)} confirmMessage={`Excluir "${row.title}"?`} />
        </div>
      )}
    />
  );
}

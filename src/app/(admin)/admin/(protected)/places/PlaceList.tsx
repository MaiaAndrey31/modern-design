"use client";

import Link from "next/link";
import { SortableList } from "@/components/admin/SortableList";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deletePlaceAction, reorderPlacesAction } from "@/app/(admin)/admin/_actions/story";

export interface PlaceRow {
  id: string;
  name: string;
  nameEn: string | null;
  coords: string;
  frame: string | null;
  isOrigin: boolean;
  globe: string | null;
  usage: number;
}

export function PlaceList({ rows }: { rows: PlaceRow[] }) {
  return (
    <SortableList
      label="Lugares"
      items={rows}
      onReorder={reorderPlacesAction}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {row.name}
              {row.nameEn && <span className="font-normal text-neutral-400"> / {row.nameEn}</span>}
              {row.isOrigin && <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">Origem</span>}
            </p>
            <p className="truncate font-mono text-xs text-neutral-500">
              {row.coords}
              <span className="font-sans">
                {row.frame && ` · enquadramento ${row.frame}`}
                {row.globe && ` · ${row.globe}`}
                {` · ${row.usage} vínculo(s)`}
              </span>
            </p>
          </div>
          <Link href={`/admin/places/${row.id}`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
            Editar
          </Link>
          <DeleteButton action={deletePlaceAction.bind(null, row.id)} confirmMessage={`Excluir "${row.name}"?`} />
        </div>
      )}
    />
  );
}

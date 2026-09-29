"use client";

import Image from "next/image";
import Link from "next/link";
import { SortableList } from "@/components/admin/SortableList";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StatusBadge } from "@/components/admin/fields";
import { deleteWorldStageAction, reorderWorldStagesAction } from "@/app/(admin)/admin/_actions/stages";

export interface StageRow {
  id: string;
  year: string;
  title: string;
  location: string;
  imageUrl: string | null;
  showInNumbers: boolean;
  missingEn: boolean;
  status: "DRAFT" | "PUBLISHED";
}

export function StageList({ rows }: { rows: StageRow[] }) {
  return (
    <SortableList
      label="Palcos"
      items={rows}
      onReorder={reorderWorldStagesAction}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
            {row.imageUrl && <Image src={row.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              <span className="tabular-nums text-neutral-500">{row.year}</span> · {row.title}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {row.location}
              {row.showInNumbers && " · conta nos Números"}
              {row.missingEn && <span className="text-amber-700"> · EN incompleto</span>}
            </p>
          </div>
          <StatusBadge status={row.status} />
          <Link href={`/admin/world-stages/${row.id}`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
            Editar
          </Link>
          <DeleteButton action={deleteWorldStageAction.bind(null, row.id)} confirmMessage={`Excluir "${row.title}"?`} />
        </div>
      )}
    />
  );
}

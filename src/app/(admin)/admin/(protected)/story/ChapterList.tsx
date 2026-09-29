"use client";

import Image from "next/image";
import Link from "next/link";
import { SortableList } from "@/components/admin/SortableList";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StatusBadge } from "@/components/admin/fields";
import { deleteChapterAction, reorderChaptersAction } from "@/app/(admin)/admin/_actions/story";

export interface ChapterRow {
  id: string;
  period: string;
  title: string;
  concept: string;
  visual: string;
  imageUrl: string | null;
  placeCount: number;
  startsGlobalAct: boolean;
  missingEn: boolean;
  status: "DRAFT" | "PUBLISHED";
}

export function ChapterList({ rows }: { rows: ChapterRow[] }) {
  return (
    <SortableList
      label="Capítulos"
      items={rows}
      onReorder={reorderChaptersAction}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
            {row.imageUrl && <Image src={row.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              <span className="tabular-nums text-neutral-500">{row.period}</span> · {row.title}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {row.concept} · {row.visual} · {row.placeCount} vínculo(s) de lugar
              {row.startsGlobalAct && " · início do ato global"}
              {row.missingEn && <span className="text-amber-700"> · EN incompleto</span>}
            </p>
          </div>
          <StatusBadge status={row.status} />
          <Link href={`/admin/story/chapters/${row.id}`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
            Editar
          </Link>
          <DeleteButton action={deleteChapterAction.bind(null, row.id)} confirmMessage={`Excluir o capítulo "${row.title}"?`} />
        </div>
      )}
    />
  );
}

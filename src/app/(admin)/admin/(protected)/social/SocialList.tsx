"use client";

import Link from "next/link";
import { SortableList } from "@/components/admin/SortableList";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteSocialLinkAction, reorderSocialLinksAction } from "@/app/(admin)/admin/_actions/social";

export interface SocialRow {
  id: string;
  label: string;
  platform: string;
  url: string;
  enabled: boolean;
  placements: string;
}

export function SocialList({ items }: { items: SocialRow[] }) {
  return (
    <SortableList
      label="Redes sociais"
      items={items}
      onReorder={reorderSocialLinksAction}
      renderItem={(row) => (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-medium ${row.enabled ? "text-neutral-900" : "text-neutral-400"}`}>
              {row.label} <span className="font-normal text-neutral-400">· {row.platform}</span>
              {!row.enabled && <span className="ml-2 text-xs font-normal">(desativada)</span>}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {row.url} · {row.placements}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/admin/social/${row.id}`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
              Editar
            </Link>
            <DeleteButton action={deleteSocialLinkAction.bind(null, row.id)} confirmMessage={`Excluir "${row.label}"?`} />
          </div>
        </div>
      )}
    />
  );
}

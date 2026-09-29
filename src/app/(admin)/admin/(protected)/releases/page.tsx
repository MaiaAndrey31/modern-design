import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteReleaseAction } from "@/app/(admin)/admin/_actions/releases";

export default async function ReleasesPage() {
  const releases = await prisma.release.findMany({ orderBy: { sortOrder: "asc" }, include: { cover: true } });

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Música</h1>
        <Link href="/admin/releases/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          + Novo lançamento
        </Link>
      </div>

      {releases.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          Nenhum lançamento publicado. Quando adicionado, ele aparece aqui e no site.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200">
          {releases.map((release) => (
            <li key={release.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                {release.cover && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    <Image src={release.cover.url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {release.title} <span className="text-neutral-400">· {release.yearLabel}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={release.status} />
                    <span className="text-xs text-neutral-500">{release.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/admin/releases/${release.id}/edit`} className="text-xs font-medium text-neutral-700">
                  Editar
                </Link>
                <DeleteButton action={deleteReleaseAction.bind(null, release.id)} confirmMessage={`Excluir "${release.title}"?`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

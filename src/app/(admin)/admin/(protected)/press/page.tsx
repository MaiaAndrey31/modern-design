import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deletePressItemAction } from "@/app/(admin)/admin/_actions/press";

export default async function PressPage() {
  const items = await prisma.pressItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Imprensa</h1>
        <Link href="/admin/press/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          + Nova matéria
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">Nenhuma matéria publicada ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-neutral-500">
                  {item.outlet} — {item.dateLabel}
                </p>
                <div className="mt-1">
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/admin/press/${item.id}/edit`} className="text-xs font-medium text-neutral-700">
                  Editar
                </Link>
                <DeleteButton action={deletePressItemAction.bind(null, item.id)} confirmMessage={`Excluir "${item.title}"?`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

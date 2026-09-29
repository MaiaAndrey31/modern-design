import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteShowAction } from "@/app/(admin)/admin/_actions/shows";
import { formatDateOnly } from "@/lib/formatDate";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default async function ShowsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const isPast = tab === "past";
  const today = startOfTodayUTC();

  const shows = await prisma.show.findMany({
    where: { date: isPast ? { lt: today } : { gte: today } },
    orderBy: { date: isPast ? "desc" : "asc" },
  });

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <Link href="/admin/shows/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          + Novo show
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-neutral-200">
        <Link
          href="/admin/shows"
          className={`px-3 py-2 text-sm ${!isPast ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}
        >
          Próximos
        </Link>
        <Link
          href="/admin/shows?tab=past"
          className={`px-3 py-2 text-sm ${isPast ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}
        >
          Passados
        </Link>
      </div>

      {shows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          {isPast ? "Nenhum show passado." : "Nenhum show na agenda. Adicione o próximo compromisso do Alan."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200">
          {shows.map((show) => (
            <li key={show.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {formatDateOnly(show.date)}
                  {" · "}
                  {show.city}
                  {show.venue ? ` · ${show.venue}` : ""}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={show.status} />
                  {show.soldOut && <span className="text-xs text-neutral-500">Esgotado</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/admin/shows/${show.id}/edit`} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
                  Editar
                </Link>
                <DeleteButton
                  action={deleteShowAction.bind(null, show.id)}
                  confirmMessage={`Excluir o show em ${show.city} — ${formatDateOnly(show.date)}?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

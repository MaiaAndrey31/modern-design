import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { MoveButtons } from "@/components/admin/MoveButtons";
import {
  deleteTimelineEventAction,
  moveTimelineEventAction,
  deleteWorldStageAction,
  moveWorldStageAction,
} from "@/app/(admin)/admin/_actions/career";

export default async function CareerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const isStages = tab === "stages";

  const [timeline, stages] = await Promise.all([
    prisma.timelineEvent.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true } }),
    prisma.worldStage.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Carreira</h1>
        <Link
          href={isStages ? "/admin/career/stages/new" : "/admin/career/timeline/new"}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {isStages ? "+ Novo palco" : "+ Novo marco"}
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-neutral-200">
        <Link href="/admin/career" className={`px-3 py-2 text-sm ${!isStages ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}>
          Linha do tempo
        </Link>
        <Link href="/admin/career?tab=stages" className={`px-3 py-2 text-sm ${isStages ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}>
          Grandes Palcos
        </Link>
      </div>

      {!isStages ? (
        timeline.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-500">Nenhum marco cadastrado.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200">
            {timeline.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <MoveButtons
                  onMoveUp={moveTimelineEventAction.bind(null, item.id, "up")}
                  onMoveDown={moveTimelineEventAction.bind(null, item.id, "down")}
                />
                {item.image && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    <Image src={item.image.url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.yearLabel} · {item.title}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <Link href={`/admin/career/timeline/${item.id}/edit`} className="text-xs font-medium text-neutral-700">
                  Editar
                </Link>
                <DeleteButton action={deleteTimelineEventAction.bind(null, item.id)} confirmMessage={`Excluir "${item.title}"?`} />
              </li>
            ))}
          </ul>
        )
      ) : stages.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">Nenhum palco cadastrado.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200">
          {stages.map((stage) => (
            <li key={stage.id} className="flex items-center gap-4 py-4">
              <MoveButtons
                onMoveUp={moveWorldStageAction.bind(null, stage.id, "up")}
                onMoveDown={moveWorldStageAction.bind(null, stage.id, "down")}
              />
              {stage.image && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                  <Image src={stage.image.url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {stage.yearLabel} · {stage.title}
                </p>
                <div className="mt-1">
                  <StatusBadge status={stage.status} />
                </div>
              </div>
              <Link href={`/admin/career/stages/${stage.id}/edit`} className="text-xs font-medium text-neutral-700">
                Editar
              </Link>
              <DeleteButton action={deleteWorldStageAction.bind(null, stage.id)} confirmMessage={`Excluir "${stage.title}"?`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

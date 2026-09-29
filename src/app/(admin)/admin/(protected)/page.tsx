import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateOnly } from "@/lib/formatDate";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function getDashboardData() {
  const [showsCount, releasesCount, galleryCount, pressCount, nextShow, recentMedia] = await Promise.all([
    prisma.show.count({ where: { status: "PUBLISHED", date: { gte: startOfTodayUTC() } } }),
    prisma.release.count({ where: { status: "PUBLISHED" } }),
    prisma.galleryItem.count({ where: { status: "PUBLISHED" } }),
    prisma.pressItem.count({ where: { status: "PUBLISHED" } }),
    prisma.show.findFirst({
      where: { status: "PUBLISHED", date: { gte: startOfTodayUTC() } },
      orderBy: { date: "asc" },
    }),
    prisma.media.count(),
  ]);

  return { showsCount, releasesCount, galleryCount, pressCount, nextShow, recentMedia };
}

const QUICK_ACTIONS = [
  { href: "/admin/shows/new", label: "+ Novo show" },
  { href: "/admin/gallery", label: "+ Adicionar fotos" },
  { href: "/admin/releases/new", label: "+ Novo lançamento" },
  { href: "/admin/press/new", label: "+ Nova matéria" },
];

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, Alan</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 divide-x divide-neutral-200 rounded-md border border-neutral-200 bg-white lg:grid-cols-4">
        {[
          { label: "Shows publicados", value: data.showsCount, href: "/admin/shows" },
          { label: "Lançamentos publicados", value: data.releasesCount, href: "/admin/releases" },
          { label: "Fotos na galeria", value: data.galleryCount, href: "/admin/gallery" },
          { label: "Matérias de imprensa", value: data.pressCount, href: "/admin/press" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="p-5 transition-colors hover:bg-neutral-50">
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-md border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Próximo show</p>
          <Link href="/admin/shows" className="text-xs text-neutral-500 hover:text-neutral-900">
            Ver agenda completa →
          </Link>
        </div>
        {data.nextShow ? (
          <p className="mt-2 text-sm text-neutral-700">
            {formatDateOnly(data.nextShow.date)}
            {" · "}
            {data.nextShow.city}
            {data.nextShow.venue ? ` · ${data.nextShow.venue}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">Nenhum show confirmado no momento.</p>
        )}
      </div>
    </div>
  );
}

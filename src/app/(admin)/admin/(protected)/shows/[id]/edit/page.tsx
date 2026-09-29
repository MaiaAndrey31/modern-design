import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShowForm } from "../../ShowForm";
import { updateShowAction } from "@/app/(admin)/admin/_actions/shows";

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await prisma.show.findUnique({ where: { id } });
  if (!show) notFound();

  const boundAction = updateShowAction.bind(null, id);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar show</h1>
      <div className="mt-6">
        <ShowForm
          initialValues={{
            id: show.id,
            title: show.title ?? "",
            date: show.date.toISOString().slice(0, 10),
            time: show.time ?? "",
            city: show.city,
            state: show.state ?? "",
            country: show.country ?? "Brasil",
            venue: show.venue,
            address: show.address ?? "",
            ticketUrl: show.ticketUrl ?? "",
            soldOut: show.soldOut,
            featured: show.featured,
            published: show.status === "PUBLISHED",
          }}
          action={boundAction}
        />
      </div>
    </div>
  );
}

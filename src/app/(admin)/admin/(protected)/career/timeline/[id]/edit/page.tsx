import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TimelineEventForm } from "../../TimelineEventForm";
import { updateTimelineEventAction } from "@/app/(admin)/admin/_actions/career";

export default async function EditTimelineEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.timelineEvent.findUnique({ where: { id }, include: { image: true } });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar marco</h1>
      <div className="mt-6">
        <TimelineEventForm
          initialValues={{
            yearLabel: item.yearLabel,
            title: item.title,
            subtitle: item.subtitle ?? "",
            description: item.description,
            published: item.status === "PUBLISHED",
            image: item.image ? { id: item.image.id, url: item.image.url } : null,
          }}
          action={updateTimelineEventAction.bind(null, id)}
        />
      </div>
    </div>
  );
}

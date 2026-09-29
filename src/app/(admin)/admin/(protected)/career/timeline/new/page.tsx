import { TimelineEventForm } from "../TimelineEventForm";
import { createTimelineEventAction } from "@/app/(admin)/admin/_actions/career";

export default function NewTimelineEventPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Novo marco</h1>
      <div className="mt-6">
        <TimelineEventForm initialValues={{ published: true }} action={createTimelineEventAction} />
      </div>
    </div>
  );
}

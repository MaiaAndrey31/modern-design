import { prisma } from "@/lib/db";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { BookingSettingsForm } from "./BookingSettingsForm";
import { BookingInbox } from "./BookingInbox";

export default async function BookingAdminPage() {
  // TEMPORARY (Phase 3 → 4): legacy single-language screen reads/writes the PT fields.
  const [settings, section, requests] = await Promise.all([
    prisma.bookingSection.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.section.findUnique({ where: { key: "booking" } }),
    prisma.bookingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Booking</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Configurações</h2>
        <div className="mt-4">
          <BookingSettingsForm
            initialValues={{
              heading: section?.titlePt ?? undefined,
              intro: section?.descriptionPt ?? undefined,
              notifyEmail: settings?.notifyEmail ?? "",
              isFormEnabled: settings?.isFormEnabled,
            }}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Pedidos recebidos</h2>
        <BookingInbox
          initialItems={requests.map((r) => ({
            id: r.id,
            name: r.name,
            company: r.company,
            whatsapp: r.whatsapp,
            email: r.email,
            city: r.city,
            eventType: r.eventType,
            eventDate: r.eventDate ? r.eventDate.toISOString().slice(0, 10) : null,
            message: r.message,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { loadSection } from "@/lib/admin/queries";
import { bookingFieldLabelsSchema } from "@/lib/validations/cms/sections";
import { AdminPage, Card } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { BookingInbox } from "./BookingInbox";
import { BookingSectionForm } from "./BookingSectionForm";

export default async function BookingAdminPage() {
  await requireSession();
  const [section, row, requests] = await Promise.all([
    loadSection("booking"),
    prisma.bookingSection.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.bookingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const d = SYSTEM_DEFAULTS.booking;
  const b = row ?? d;
  // The stored JSON is parsed, never trusted: invalid → defaults.
  const labels = bookingFieldLabelsSchema.safeParse(b.fieldLabels);

  return (
    <AdminPage eyebrow="Conteúdo" title="Booking" description="Formulário de contratação e pedidos recebidos.">
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="booking" values={section} />
      </Card>

      <BookingSectionForm
        initial={{
          successTitlePt: b.successTitlePt,
          successTitleEn: b.successTitleEn,
          successMessagePt: b.successMessagePt,
          successMessageEn: b.successMessageEn,
          submitLabelPt: b.submitLabelPt,
          submitLabelEn: b.submitLabelEn,
          pausedMessagePt: b.pausedMessagePt,
          pausedMessageEn: b.pausedMessageEn,
          fieldLabels: labels.success ? labels.data : d.fieldLabels,
          notifyEmail: b.notifyEmail ?? "",
          isFormEnabled: b.isFormEnabled,
        }}
      />

      <Card title="Pedidos recebidos">
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
      </Card>
    </AdminPage>
  );
}

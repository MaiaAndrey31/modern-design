import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PressForm } from "../../PressForm";
import { updatePressItemAction } from "@/app/(admin)/admin/_actions/press";

export default async function EditPressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.pressItem.findUnique({ where: { id }, include: { logo: true } });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar matéria</h1>
      <div className="mt-6">
        <PressForm
          initialValues={{
            outlet: item.outlet,
            title: item.title,
            dateLabel: item.dateLabel,
            url: item.url ?? "",
            excerptPt: item.excerptPt,
            excerptEn: item.excerptEn,
            publishedAt: item.publishedAt ? item.publishedAt.toISOString().slice(0, 10) : "",
            logo: item.logo ? { id: item.logo.id, url: item.logo.url } : null,
            published: item.status === "PUBLISHED",
          }}
          action={updatePressItemAction.bind(null, id)}
        />
      </div>
    </div>
  );
}

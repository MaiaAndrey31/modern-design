import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { isLabelPosition } from "@/lib/story/registry";
import { updatePlaceAction } from "@/app/(admin)/admin/_actions/story";
import { AdminPage } from "@/components/admin/ui";
import { PlaceForm } from "../PlaceForm";

export default async function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place) notFound();

  return (
    <AdminPage eyebrow="Conteúdo · Lugares" title={`Editar: ${place.namePt}`}>
      <PlaceForm
        action={updatePlaceAction.bind(null, id)}
        initial={{
          namePt: place.namePt,
          nameEn: place.nameEn,
          latitude: place.latitude,
          longitude: place.longitude,
          labelPosition: isLabelPosition(place.labelPosition) ? place.labelPosition : "right",
          cameraWidthDeg: place.cameraWidthDeg,
          isOrigin: place.isOrigin,
          showOnGlobe: place.showOnGlobe,
          globeOrder: place.globeOrder,
        }}
      />
    </AdminPage>
  );
}

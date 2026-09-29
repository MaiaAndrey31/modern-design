import { requireSession } from "@/lib/auth/guards";
import { createPlaceAction } from "@/app/(admin)/admin/_actions/story";
import { AdminPage } from "@/components/admin/ui";
import { PlaceForm } from "../PlaceForm";

export default async function NewPlacePage() {
  await requireSession();
  return (
    <AdminPage eyebrow="Conteúdo · Lugares" title="Novo lugar">
      <PlaceForm
        action={createPlaceAction}
        initial={{ namePt: "", nameEn: null, latitude: "", longitude: "", labelPosition: "right", cameraWidthDeg: null, isOrigin: false, showOnGlobe: false, globeOrder: null }}
      />
    </AdminPage>
  );
}

import { requireSession } from "@/lib/auth/guards";
import { loadPlaceOptions } from "@/lib/admin/queries";
import { createChapterAction } from "@/app/(admin)/admin/_actions/story";
import { AdminPage } from "@/components/admin/ui";
import { ChapterForm } from "../../ChapterForm";

export default async function NewChapterPage() {
  await requireSession();
  const places = await loadPlaceOptions();

  return (
    <AdminPage eyebrow="Conteúdo · História" title="Novo capítulo">
      <ChapterForm
        action={createChapterAction}
        places={places}
        initial={{
          periodLabelPt: "",
          periodLabelEn: null,
          axisLabel: null,
          ghostLabelPt: null,
          ghostLabelEn: null,
          conceptPt: "",
          conceptEn: null,
          titlePt: "",
          titleEn: null,
          placeLabelPt: null,
          placeLabelEn: null,
          textPt: "",
          textEn: null,
          pullQuotePt: null,
          pullQuoteEn: null,
          visualType: "map",
          image: null,
          allowPhoto: true,
          showRings: false,
          startsGlobalAct: false,
          scrollWeight: 1,
          published: false,
          cameraPlaceIds: [],
          labelPlaceIds: [],
          pulsePlaceId: null,
          routeFromPlaceId: null,
          routeToPlaceId: null,
        }}
      />
    </AdminPage>
  );
}

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { loadSection, mediaValue } from "@/lib/admin/queries";
import { AdminPage, Card } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { PressKitForm } from "./PressKitForm";

export default async function PressKitPage() {
  await requireSession();
  const [section, row] = await Promise.all([
    loadSection("pressKit"),
    prisma.pressKitSection.findUnique({ where: { id: SINGLETON_ID }, include: { oneSheet: true, photoPack: true, logoPack: true } }),
  ]);
  const k = row ?? { ...SYSTEM_DEFAULTS.pressKit, oneSheet: null, photoPack: null, logoPack: null };

  return (
    <AdminPage eyebrow="Conteúdo" title="Press Kit" description="Material para produtores e imprensa.">
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="pressKit" values={section} />
      </Card>
      <PressKitForm
        initial={{
          bioOverridePt: k.bioOverridePt,
          bioOverrideEn: k.bioOverrideEn,
          downloadsNotePt: k.downloadsNotePt,
          downloadsNoteEn: k.downloadsNoteEn,
          oneSheet: mediaValue(k.oneSheet),
          photoPack: mediaValue(k.photoPack),
          logoPack: mediaValue(k.logoPack),
        }}
      />
    </AdminPage>
  );
}

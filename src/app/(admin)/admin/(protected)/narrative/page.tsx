import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { mediaValue } from "@/lib/admin/queries";
import { AdminPage } from "@/components/admin/ui";
import { NarrativeForm } from "./NarrativeForm";

export default async function NarrativePage() {
  await requireSession();
  const [row, brand] = await Promise.all([
    prisma.narrativeSection.findUnique({ where: { id: SINGLETON_ID }, include: { backgroundImage: true } }),
    prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID }, select: { brandName: true } }),
  ]);
  const n = row ?? { ...SYSTEM_DEFAULTS.narrative, backgroundImage: null };

  return (
    <AdminPage eyebrow="Conteúdo" title="Transição" description="Frases que surgem uma a uma durante o scroll, terminando em uma palavra final.">
      <NarrativeForm
        brandName={brand?.brandName ?? SYSTEM_DEFAULTS.brand.brandName}
        initial={{
          linesPt: n.linesPt,
          linesEn: n.linesEn,
          finalWordPt: n.finalWordPt,
          finalWordEn: n.finalWordEn,
          vhPerLine: n.vhPerLine,
          background: mediaValue(n.backgroundImage),
        }}
      />
    </AdminPage>
  );
}

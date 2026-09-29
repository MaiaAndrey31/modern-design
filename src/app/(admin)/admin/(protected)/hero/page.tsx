import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { loadSection, mediaValue } from "@/lib/admin/queries";
import { AdminPage, Card } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { HeroForm } from "./HeroForm";

export default async function HeroPage() {
  await requireSession();
  const [row, brand, section] = await Promise.all([
    prisma.heroSection.findUnique({ where: { id: SINGLETON_ID }, include: { backgroundImage: true, video: true, posterImage: true } }),
    prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID }, select: { brandName: true } }),
    loadSection("hero"),
  ]);
  const d = SYSTEM_DEFAULTS.hero;
  const h = row ?? { ...d, backgroundImage: null, video: null, posterImage: null };

  return (
    <AdminPage eyebrow="Conteúdo" title="Hero" description="Primeira tela do site. Sempre ativa e sempre no topo.">
      <Card title="Eyebrow" description="Linha pequena acima do título.">
        <SectionCopyForm sectionKey="hero" values={section} />
      </Card>
      <HeroForm
        brandName={brand?.brandName ?? SYSTEM_DEFAULTS.brand.brandName}
        initialValues={{
          headlineLinesPt: h.headlineLinesPt,
          headlineLinesEn: h.headlineLinesEn,
          background: mediaValue(h.backgroundImage),
          video: mediaValue(h.video),
          poster: mediaValue(h.posterImage),
          youtubeUrl: h.youtubeUrl ?? "",
          backgroundType: h.youtubeUrl ? "youtube" : h.video ? "video" : "image",
          enableWebgl: h.enableWebgl,
          foundedLabelPt: h.foundedLabelPt,
          foundedLabelEn: h.foundedLabelEn,
          primaryCta: { labelPt: h.primaryCtaLabelPt, labelEn: h.primaryCtaLabelEn, type: h.primaryCtaType, target: h.primaryCtaTarget },
          secondaryCta: { labelPt: h.secondaryCtaLabelPt, labelEn: h.secondaryCtaLabelEn, type: h.secondaryCtaType, target: h.secondaryCtaTarget },
        }}
      />
    </AdminPage>
  );
}

import { prisma } from "@/lib/db";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { HeroForm } from "./HeroForm";
import { BioForm } from "./BioForm";
import { StatementForm } from "./StatementForm";

export default async function HomepagePage() {
  // TEMPORARY (Phase 3 → 4): legacy single-language screen reads/writes the PT fields.
  const [hero, heroSection, profile, statement] = await Promise.all([
    prisma.heroSection.findUnique({ where: { id: SINGLETON_ID }, include: { backgroundImage: true, video: true } }),
    prisma.section.findUnique({ where: { key: "hero" } }),
    prisma.profile.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.statementSection.findUnique({ where: { id: SINGLETON_ID }, include: { backgroundImage: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Página inicial</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Hero</h2>
        <div className="mt-4">
          <HeroForm
            initialValues={{
              headlineLine1: hero?.headlineLinesPt?.[0] ?? "",
              headlineLine2: hero?.headlineLinesPt?.[1] ?? "",
              eyebrowOverride: heroSection?.eyebrowPt ?? "",
              primaryCtaLabel: hero?.primaryCtaLabelPt ?? undefined,
              primaryCtaTarget: hero?.primaryCtaTarget ?? undefined,
              secondaryCtaLabel: hero?.secondaryCtaLabelPt ?? undefined,
              secondaryCtaTarget: hero?.secondaryCtaTarget ?? undefined,
              enableWebgl: hero?.enableWebgl,
              background: hero?.backgroundImage ? { id: hero.backgroundImage.id, url: hero.backgroundImage.url } : null,
              backgroundType: hero?.youtubeUrl ? "youtube" : hero?.video ? "video" : "image",
              video: hero?.video ? { id: hero.video.id, url: hero.video.url } : null,
              youtubeUrl: hero?.youtubeUrl ?? "",
            }}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Statement</h2>
        <div className="mt-4">
          <StatementForm
            background={statement?.backgroundImage ? { id: statement.backgroundImage.id, url: statement.backgroundImage.url } : null}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Biografia</h2>
        <div className="mt-4">
          <BioForm bioFull={profile?.bioPt ?? ""} />
        </div>
      </section>
    </div>
  );
}

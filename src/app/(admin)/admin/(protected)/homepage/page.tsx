import { prisma } from "@/lib/db";
import { HeroForm } from "./HeroForm";
import { BioForm } from "./BioForm";
import { StatementForm } from "./StatementForm";

export default async function HomepagePage() {
  const [hero, site, statement] = await Promise.all([
    prisma.hero.findUnique({ where: { id: "singleton" }, include: { backgroundImage: true, video: true } }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.statementSection.findUnique({ where: { id: "singleton" }, include: { backgroundImage: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Página inicial</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Hero</h2>
        <div className="mt-4">
          <HeroForm
            initialValues={{
              headlineLine1: hero?.headlineLines?.[0] ?? "Alan",
              headlineLine2: hero?.headlineLines?.[1] ?? "Saher",
              eyebrowOverride: hero?.eyebrowOverride ?? "",
              primaryCtaLabel: hero?.primaryCtaLabel,
              primaryCtaTarget: hero?.primaryCtaTarget,
              secondaryCtaLabel: hero?.secondaryCtaLabel,
              secondaryCtaTarget: hero?.secondaryCtaTarget,
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Statement — From Minas to the World</h2>
        <div className="mt-4">
          <StatementForm
            background={statement?.backgroundImage ? { id: statement.backgroundImage.id, url: statement.backgroundImage.url } : null}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Biografia</h2>
        <div className="mt-4">
          <BioForm bioFull={site?.bioFull ?? ""} />
        </div>
      </section>
    </div>
  );
}

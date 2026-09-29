import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { loadSection, mediaValue } from "@/lib/admin/queries";
import { AdminPage, Card } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";
import { FrameForm } from "./FrameForm";

const SLOTS = [1, 2, 3, 4] as const;

export default async function ExperiencePage() {
  await requireSession();
  const [section, frames] = await Promise.all([loadSection("experience"), prisma.experienceFrame.findMany({ include: { media: true } })]);

  return (
    <AdminPage eyebrow="Conteúdo" title="Experience" description="Grade editorial fixa de 4 imagens com parallax. Quadros não publicados não aparecem.">
      <Card title="Textos da seção">
        <SectionCopyForm sectionKey="experience" values={section} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {SLOTS.map((slot) => {
          const frame = frames.find((f) => f.slot === slot);
          return (
            <Card key={slot} title={`Quadro ${slot}`}>
              <FrameForm
                slot={slot}
                initial={{
                  layout: frame?.layout ?? (slot === 1 || slot === 4 ? "WIDE" : "TALL"),
                  offsetPx: frame?.offsetPx ?? 0,
                  media: mediaValue(frame?.media),
                  altPt: frame?.altPt ?? "",
                  altEn: frame?.altEn ?? null,
                  published: frame?.status === "PUBLISHED",
                }}
              />
            </Card>
          );
        })}
      </div>
    </AdminPage>
  );
}

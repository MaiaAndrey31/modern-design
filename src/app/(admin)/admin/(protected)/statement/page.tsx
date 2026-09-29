import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { mediaValue } from "@/lib/admin/queries";
import { AdminPage } from "@/components/admin/ui";
import { StatementForm } from "./StatementForm";

export default async function StatementPage() {
  await requireSession();
  const row = await prisma.statementSection.findUnique({ where: { id: SINGLETON_ID }, include: { backgroundImage: true } });
  const s = row ?? { ...SYSTEM_DEFAULTS.statement, backgroundImage: null };

  return (
    <AdminPage eyebrow="Conteúdo" title="Statement" description="A frase-manifesto em tela cheia, com o globo de origem.">
      <StatementForm
        initial={{
          linesPt: s.linesPt,
          linesEn: s.linesEn,
          accentIndex: s.accentIndex,
          background: mediaValue(s.backgroundImage),
          showGlobe: s.showGlobe,
        }}
      />
    </AdminPage>
  );
}

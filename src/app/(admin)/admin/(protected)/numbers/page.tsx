import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { loadSection } from "@/lib/admin/queries";
import { AdminPage, Card, Notice } from "@/components/admin/ui";
import { SectionCopyForm } from "@/components/admin/SectionCopyForm";

export default async function NumbersPage() {
  await requireSession();
  const [section, profile, stagesInNumbers] = await Promise.all([
    loadSection("numbers"),
    prisma.profile.findUnique({ where: { id: SINGLETON_ID }, select: { foundedYear: true } }),
    prisma.worldStage.count({ where: { status: "PUBLISHED", showInNumbers: true } }),
  ]);

  return (
    <AdminPage eyebrow="Conteúdo" title="Números" description="Contadores animados: anos de carreira e palcos pelo mundo.">
      <Notice>
        Os números são calculados automaticamente: <strong>{profile?.foundedYear ? `desde ${profile.foundedYear}` : "ano de início não definido"}</strong> (
        <Link href="/admin/profile" className="underline">
          Perfil
        </Link>
        ) e <strong>{stagesInNumbers} palco(s)</strong> marcados para os números (
        <Link href="/admin/world-stages" className="underline">
          World Stages
        </Link>
        ). Aqui você edita apenas os rótulos.
      </Notice>
      <Card title="Rótulos">
        <SectionCopyForm sectionKey="numbers" values={section} />
      </Card>
    </AdminPage>
  );
}

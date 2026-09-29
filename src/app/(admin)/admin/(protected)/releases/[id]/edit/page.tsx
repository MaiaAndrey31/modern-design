import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReleaseForm } from "../../ReleaseForm";
import { updateReleaseAction } from "@/app/(admin)/admin/_actions/releases";

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = await prisma.release.findUnique({ where: { id }, include: { cover: true } });
  if (!release) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar lançamento</h1>
      <div className="mt-6">
        <ReleaseForm
          initialValues={{
            title: release.title,
            yearLabel: release.yearLabel,
            type: release.type,
            spotifyUrl: release.spotifyUrl ?? "",
            appleMusicUrl: release.appleMusicUrl ?? "",
            youtubeUrl: release.youtubeUrl ?? "",
            published: release.status === "PUBLISHED",
            cover: release.cover ? { id: release.cover.id, url: release.cover.url } : null,
          }}
          action={updateReleaseAction.bind(null, id)}
        />
      </div>
    </div>
  );
}

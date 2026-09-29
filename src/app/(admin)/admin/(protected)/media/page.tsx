import { listMedia } from "@/app/(admin)/admin/_actions/mediaQueries";
import { MediaLibraryClient } from "./MediaLibraryClient";

export default async function MediaLibraryPage() {
  const items = await listMedia();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Biblioteca de mídia</h1>
      <div className="mt-6">
        <MediaLibraryClient initialItems={items} />
      </div>
    </div>
  );
}

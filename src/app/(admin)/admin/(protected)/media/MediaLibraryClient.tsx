"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { listMedia, type MediaListItem } from "@/app/(admin)/admin/_actions/mediaQueries";
import { deleteMedia } from "@/app/(admin)/admin/_actions/media";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { uploadFile } from "@/lib/uploadFile";
import { ALLOWED_VIDEO_MIME_TYPES, MEDIA_FOLDERS, MEDIA_FOLDER_LABELS, type MediaFolder } from "@/lib/validations/media";
import { MediaEditDialog } from "./MediaEditDialog";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function folderLabel(folder: string) {
  return MEDIA_FOLDER_LABELS[folder as MediaFolder] ?? folder;
}

export function MediaLibraryClient({ initialItems }: { initialItems: MediaListItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [folder, setFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<MediaListItem | null>(null);

  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("general");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    startTransition(async () => {
      const results = await listMedia({ folder, search: search || undefined });
      setItems(results);
    });
  };

   
  useEffect(reload, [folder, search]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const list = Array.from(files);
    const errors: string[] = [];
    for (const [index, file] of list.entries()) {
      setUploadStatus(`Enviando ${index + 1} de ${list.length}…`);
      const kind = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type) ? "video" : "image";
      const result = await uploadFile(file, uploadFolder, undefined, kind);
      if (!result.ok) errors.push(`${file.name}: ${result.error ?? "falha no envio"}`);
    }
    setUploadStatus(null);
    if (errors.length) setUploadError(errors.join(" · "));
    if (fileInputRef.current) fileInputRef.current.value = "";
    reload();
  };

  const selectClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <label htmlFor="upload-folder" className="text-sm text-neutral-700">
          Enviar para
        </label>
        <select id="upload-folder" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} className={selectClass}>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f}>
              {MEDIA_FOLDER_LABELS[f]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus !== null}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploadStatus ?? "Enviar arquivos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-xs text-neutral-500">ou arraste arquivos para cá · JPG, PNG, WEBP, AVIF ou MP4</span>
        {uploadError && <p className="w-full text-xs text-red-600">{uploadError}</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descrição…"
          aria-label="Buscar por descrição"
          className={selectClass}
        />
        <select
          value={folder}
          onChange={(e) => {
            setFolder(e.target.value);
            // Uploading while filtered to a category defaults the upload to it.
            if (e.target.value !== "all") setUploadFolder(e.target.value as MediaFolder);
          }}
          aria-label="Filtrar por categoria"
          className={selectClass}
        >
          <option value="all">Todas as categorias</option>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f}>
              {MEDIA_FOLDER_LABELS[f]}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">{items.length} arquivo(s)</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">Nenhum arquivo encontrado.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-neutral-200 bg-white p-2">
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="relative block aspect-square w-full overflow-hidden rounded hover:ring-2 hover:ring-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label={`Editar ${item.alt || "mídia sem descrição"}`}
              >
                {item.kind === "VIDEO" ? (
                  <video src={item.url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <Image src={item.url} alt={item.alt ?? ""} fill sizes="200px" className="object-cover" unoptimized />
                )}
              </button>
              <span className="mt-2 inline-block max-w-full truncate rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                {folderLabel(item.folder)}
              </span>
              <p className="mt-1 truncate text-xs text-neutral-600" title={item.alt ?? ""}>
                {item.alt || "(sem descrição)"}
              </p>
              <p className="text-[11px] text-neutral-400">
                {item.width}×{item.height} · {formatSize(item.sizeBytes)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => setEditing(item)} className="text-[11px] font-medium text-neutral-700 hover:text-neutral-900">
                  Editar
                </button>
                <DeleteButton
                  label="Excluir"
                  confirmMessage="Excluir esta imagem?"
                  action={async () => {
                    const result = await deleteMedia(item.id);
                    if (result.ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
                    return result;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MediaEditDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            // Drop it from view if it no longer matches the active category filter.
            setItems((prev) =>
              folder !== "all" && updated.folder !== folder
                ? prev.filter((i) => i.id !== updated.id)
                : prev.map((i) => (i.id === updated.id ? updated : i))
            );
          }}
        />
      )}
    </div>
  );
}

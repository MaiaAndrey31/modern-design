"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { listMedia, type MediaListItem } from "@/app/(admin)/admin/_actions/mediaQueries";
import { uploadFile, type UploadKind } from "@/lib/uploadFile";
import { MEDIA_FOLDERS, MEDIA_FOLDER_LABELS } from "@/lib/validations/media";

interface MediaPickerModalProps {
  folder: string;
  kind?: UploadKind;
  onSelect: (media: { id: string; url: string }) => void;
  onClose: () => void;
}

export function MediaPickerModal({ folder, kind = "image", onSelect, onClose }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaListItem[]>([]);
  // Opens on the section's own category, but any category can be browsed —
  // an image filed under "Galeria" can still be used in the timeline, etc.
  const [filterFolder, setFilterFolder] = useState<string>(folder);
  const [search, setSearch] = useState("");
  const [isLoading, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    startTransition(async () => {
      const results = await listMedia({ folder: filterFolder, search: search || undefined, kind: kind === "video" ? "VIDEO" : "IMAGE" });
      setItems(results);
    });
  };

   
  useEffect(load, [filterFolder, search, kind]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    const file = files[0];
    const result = await uploadFile(file, folder, undefined, kind);
    setIsUploading(false);
    if (!result.ok || !result.mediaId || !result.url) {
      setUploadError(result.error ?? "Falha no envio.");
      return;
    }
    onSelect({ id: result.mediaId, url: result.url });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p className="text-sm font-medium">{kind === "video" ? "Escolher vídeo" : "Escolher imagem"}</p>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900" aria-label="Fechar">
            Fechar
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-3">
          <button type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {isUploading ? "Enviando…" : "Enviar novo arquivo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={kind === "video" ? "video/mp4" : "image/jpeg,image/png,image/webp,image/avif"}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              // This modal renders inside the host <form>: Enter here must not submit it.
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Buscar…"
              aria-label="Buscar por descrição"
              className="w-32 rounded-md border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-neutral-900"
            />
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              aria-label="Categoria"
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-neutral-900"
            >
              <option value="all">Todas as categorias</option>
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {MEDIA_FOLDER_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          {isLoading ? (
            <p className="text-sm text-neutral-500">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {kind === "video" ? "Nenhum vídeo" : "Nenhuma imagem"} encontrado aqui. Envie um arquivo acima, arraste para cá ou escolha “Todas as categorias”.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => (
                <button type="button"
                  key={item.id}
                  onClick={() => onSelect({ id: item.id, url: item.url })}
                  title={item.alt ?? undefined}
                  className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900"
                >
                  {item.kind === "VIDEO" ? (
                    <video src={item.url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Image src={item.url} alt={item.alt ?? ""} fill sizes="200px" className="object-cover" unoptimized />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-neutral-200 px-5 py-3">
          <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

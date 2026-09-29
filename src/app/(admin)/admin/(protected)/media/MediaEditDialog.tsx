"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateMediaMeta } from "@/app/(admin)/admin/_actions/media";
import { getMediaUsageLabels, type MediaListItem } from "@/app/(admin)/admin/_actions/mediaQueries";
import { MEDIA_FOLDERS, MEDIA_FOLDER_LABELS, type MediaFolder } from "@/lib/validations/media";

interface MediaEditDialogProps {
  item: MediaListItem;
  onClose: () => void;
  onSaved: (item: MediaListItem) => void;
}

export function MediaEditDialog({ item, onClose, onSaved }: MediaEditDialogProps) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [title, setTitle] = useState(item.title ?? "");
  const [folder, setFolder] = useState<MediaFolder>(
    (MEDIA_FOLDERS as readonly string[]).includes(item.folder) ? (item.folder as MediaFolder) : "general"
  );
  const [usedIn, setUsedIn] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMediaUsageLabels(item.id).then((labels) => {
      if (!cancelled) setUsedIn(labels);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("select, input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startSaving(async () => {
      const result = await updateMediaMeta(item.id, { alt, title, folder });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved({ ...item, alt: alt.trim() || null, title: title.trim() || null, folder });
    });
  };

  const inputClass = "mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-edit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p id="media-edit-title" className="text-sm font-medium">
            Editar {item.kind === "VIDEO" ? "vídeo" : "imagem"}
          </p>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-900">
            Fechar
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 sm:flex-row">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 sm:w-56">
            {item.kind === "VIDEO" ? (
              <video src={item.url} muted playsInline controls preload="metadata" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <Image src={item.url} alt={item.alt ?? ""} fill sizes="224px" className="object-contain" unoptimized />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label htmlFor="media-folder" className="block text-sm font-medium text-neutral-700">
                Categoria
              </label>
              <select id="media-folder" value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder)} className={inputClass}>
                {MEDIA_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {MEDIA_FOLDER_LABELS[f]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                Define em qual seção esta mídia aparece ao clicar em “Escolher imagem” no painel.
              </p>
            </div>

            <div>
              <label htmlFor="media-alt" className="block text-sm font-medium text-neutral-700">
                Descrição (texto alternativo)
              </label>
              <input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={300}
                placeholder="Ex.: Alan Saher tocando na Copa do Mundo 2014"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">Lida por leitores de tela e pelo Google. Também é usada na busca da biblioteca.</p>
            </div>

            <div>
              <label htmlFor="media-title" className="block text-sm font-medium text-neutral-700">
                Título interno (opcional)
              </label>
              <input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputClass} />
            </div>

            <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              {usedIn === null ? (
                "Verificando onde está em uso…"
              ) : usedIn.length === 0 ? (
                "Não está em uso no site."
              ) : (
                <>
                  <span className="font-medium text-neutral-800">Em uso em:</span> {usedIn.join(", ")}
                </>
              )}
            </div>

            <p className="text-[11px] text-neutral-400">
              {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
              <button type="button" onClick={() => navigator.clipboard.writeText(item.url)} className="underline hover:text-neutral-700">
                Copiar URL
              </button>
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isSaving ? "Salvando…" : "Salvar"}
              </button>
              <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-900">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

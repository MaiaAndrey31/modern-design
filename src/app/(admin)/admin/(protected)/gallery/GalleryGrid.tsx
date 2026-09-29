"use client";

import { useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadFile } from "@/lib/uploadFile";
import { addGalleryItem, updateGalleryItem, deleteGalleryItem, reorderGalleryItems } from "@/app/(admin)/admin/_actions/gallery";
import { DeleteButton } from "@/components/admin/DeleteButton";

export interface GalleryAdminItem {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  status: "DRAFT" | "PUBLISHED";
}

function SortableTile({ item, onEdit }: { item: GalleryAdminItem; onEdit: (item: GalleryAdminItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-white"
    >
      <Image src={item.url} alt={item.alt} fill sizes="200px" className="object-cover" unoptimized />
      <button
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
        className="absolute left-1.5 top-1.5 cursor-grab rounded bg-white/90 px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100 active:cursor-grabbing"
      >
        ⠿
      </button>
      <span
        className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          item.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
        }`}
      >
        {item.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
      </span>
      <button
        onClick={() => onEdit(item)}
        className="absolute right-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[11px] opacity-0 group-hover:opacity-100"
      >
        Editar
      </button>
    </div>
  );
}

export function GalleryGrid({ initialItems }: { initialItems: GalleryAdminItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<GalleryAdminItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  // Stable id so dnd-kit's generated aria-describedby matches between SSR and hydration.
  const dndContextId = useId();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Compute outside the setState updater: updaters run during render (and
    // twice in StrictMode), so side effects like the server action can't live there.
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      await reorderGalleryItems(next.map((i) => i.id));
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      const result = await uploadFile(file, "gallery", file.name.replace(/\.[^.]+$/, ""));
      if (!result.ok || !result.mediaId || !result.url) {
        setUploadError(result.error ?? "Falha no envio.");
        continue;
      }
      const created = await addGalleryItem(result.mediaId, file.name.replace(/\.[^.]+$/, ""));
      setItems((prev) => [...prev, { id: created.id, url: result.url!, alt: file.name, caption: null, status: "PUBLISHED" }]);
    }
    setIsUploading(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isUploading ? "Enviando…" : "Enviar fotos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">Nenhuma foto ainda. Envie a primeira acima.</p>
      ) : (
        <DndContext id={dndContextId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {items.map((item) => (
                <SortableTile key={item.id} item={item} onEdit={setEditing} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm font-medium">Editar foto</p>
            <label className="mt-4 block text-sm font-medium text-neutral-700">Descrição da imagem (alt)</label>
            <input
              defaultValue={editing.alt}
              onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
              className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <label className="mt-4 block text-sm font-medium text-neutral-700">Legenda (opcional)</label>
            <input
              defaultValue={editing.caption ?? ""}
              onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
              className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.status === "PUBLISHED"}
                onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "PUBLISHED" : "DRAFT" })}
                className="h-4 w-4 accent-neutral-900"
              />
              Publicado
            </label>

            <div className="mt-6 flex items-center justify-between">
              <DeleteButton
                confirmMessage="Excluir esta foto da galeria?"
                action={async () => {
                  await deleteGalleryItem(editing.id);
                  setItems((prev) => prev.filter((i) => i.id !== editing.id));
                  setEditing(null);
                }}
              />
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="text-sm text-neutral-500">
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await updateGalleryItem(editing.id, { alt: editing.alt, caption: editing.caption ?? undefined, status: editing.status });
                    setItems((prev) => prev.map((i) => (i.id === editing.id ? editing : i)));
                    setEditing(null);
                  }}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

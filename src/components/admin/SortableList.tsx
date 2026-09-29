"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ActionState } from "@/lib/validations/admin/actionState";

interface SortableListProps<T extends { id: string }> {
  items: T[];
  /** Persists the new order (ids, top to bottom). Returning { ok: false } rolls the UI back. */
  onReorder: (ids: string[]) => Promise<ActionState | void>;
  renderItem: (item: T) => ReactNode;
  /** Accessible name of the list, e.g. "Capítulos". */
  label: string;
}

function Row({ id, index, count, onMove, children }: { id: string; index: number; count: number; onMove: (from: number, to: number) => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-white px-3 py-3 ${isDragging ? "relative z-10 shadow-lg ring-1 ring-neutral-200" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        className="cursor-grab touch-none rounded px-1.5 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label="Mover para cima"
          className="text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === count - 1}
          aria-label="Mover para baixo"
          className="text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
        >
          ▼
        </button>
      </div>
    </li>
  );
}

/** Drag-and-drop (mouse, touch, keyboard) + ▲▼ fallback. Optimistic, with rollback on server rejection. */
export function SortableList<T extends { id: string }>({ items: initialItems, onReorder, renderItem, label }: SortableListProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Stable id so dnd-kit's aria-describedby matches between SSR and hydration.
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Re-sync when the server sends a different list (after create/delete + refresh).
  const [source, setSource] = useState(initialItems);
  if (source !== initialItems) {
    setSource(initialItems);
    setItems(initialItems);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    setError(null);
    startTransition(async () => {
      const result = await onReorder(next.map((i) => i.id));
      if (result && !result.ok) {
        setItems(previous);
        setError(result.error ?? "Não foi possível salvar a nova ordem.");
      }
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id)
    );
  };

  return (
    <div>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul aria-label={label} aria-busy={isPending} className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200">
            {items.map((item, index) => (
              <Row key={item.id} id={item.id} index={index} count={items.length} onMove={move}>
                {renderItem(item)}
              </Row>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

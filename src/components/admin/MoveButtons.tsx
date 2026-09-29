"use client";

import { useTransition } from "react";

export function MoveButtons({ onMoveUp, onMoveDown }: { onMoveUp: () => Promise<void>; onMoveDown: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex flex-col">
      <button
        disabled={isPending}
        onClick={() => startTransition(onMoveUp)}
        aria-label="Mover para cima"
        className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
      >
        ▲
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(onMoveDown)}
        aria-label="Mover para baixo"
        className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}

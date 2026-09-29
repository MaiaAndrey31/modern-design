"use client";

import { useTransition } from "react";

interface DeleteButtonProps {
  action: () => Promise<{ ok: boolean; error?: string; usedIn?: string[] } | void>;
  confirmMessage: string;
  label?: string;
}

/** Confirms before calling a bound delete Server Action; surfaces a blocking "in use" error inline via window.alert (kept simple — this is an admin-only utility action, not public UX). */
export function DeleteButton({ action, confirmMessage, label = "Excluir" }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`${confirmMessage}\n\nEssa ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) {
        const usedIn = result.usedIn?.length ? `\n\nUsada em: ${result.usedIn.join(", ")}.` : "";
        window.alert(`${result.error ?? "Não foi possível excluir."}${usedIn}`);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {isPending ? "Excluindo…" : label}
    </button>
  );
}

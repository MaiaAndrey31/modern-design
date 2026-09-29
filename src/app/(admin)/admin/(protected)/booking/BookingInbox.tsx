"use client";

import { useState, useTransition } from "react";
import { setBookingRequestStatusAction, deleteBookingRequestAction } from "@/app/(admin)/admin/_actions/booking";
import { DeleteButton } from "@/components/admin/DeleteButton";

export interface BookingRequestItem {
  id: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string;
  city: string;
  eventType: string;
  eventDate: string | null;
  message: string | null;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
}

const STATUS_LABEL: Record<BookingRequestItem["status"], string> = {
  NEW: "Novo",
  READ: "Lido",
  REPLIED: "Respondido",
  ARCHIVED: "Arquivado",
};

export function BookingInbox({ initialItems }: { initialItems: BookingRequestItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-neutral-500">Nenhum pedido de booking recebido ainda.</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-neutral-200">
      {items.map((item) => (
        <li key={item.id} className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                {item.name} {item.company && <span className="text-neutral-400">· {item.company}</span>}
              </p>
              <p className="text-xs text-neutral-500">
                {item.city} · {item.eventType} · {item.whatsapp} · {item.email}
              </p>
              {item.message && <p className="mt-1 max-w-xl text-sm text-neutral-700">{item.message}</p>}
              <p className="mt-1 text-[11px] text-neutral-400">
                {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
                  new Date(item.createdAt)
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={item.status}
                onChange={(e) => {
                  const status = e.target.value as BookingRequestItem["status"];
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
                  startTransition(() => setBookingRequestStatusAction(item.id, status));
                }}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <DeleteButton
                confirmMessage={`Excluir o pedido de ${item.name}?`}
                action={async () => {
                  await deleteBookingRequestAction(item.id);
                  setItems((prev) => prev.filter((i) => i.id !== item.id));
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

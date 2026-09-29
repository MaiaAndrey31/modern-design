import Link from "next/link";
import type { ReactNode } from "react";

/** Page frame shared by every admin screen: title, optional description and actions. */
export function AdminPage({
  title,
  description,
  actions,
  eyebrow,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

/** A titled block of related fields. */
export function Card({ title, description, children }: { title?: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
      {title && <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>}
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      <div className={title || description ? "mt-5 space-y-5" : "space-y-5"}>{children}</div>
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning"; children: ReactNode }) {
  const cls = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-neutral-200 bg-neutral-50 text-neutral-600";
  return <div className={`rounded-md border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
      {children}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">{children}</p>;
}

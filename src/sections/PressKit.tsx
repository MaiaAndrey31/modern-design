"use client";

import type { PressKitDto } from "@/lib/content/dto";
import { Reveal } from "@/components/Reveal";
import { useLocale } from "@/i18n/LocaleProvider";

/**
 * Prepared for promoters/press: short + full bio now, downloadable assets
 * (photos, logos, one-sheet PDF) once they exist. See README > "Press Kit".
 */
export function PressKit({ pressKit }: { pressKit: PressKitDto }) {
  const { tc } = useLocale();

  return (
    <section aria-label={tc(pressKit.eyebrow)} className="relative pb-[var(--section-padding-y)]">
      <div className="container-edit grid grid-cols-1 gap-12 border-t border-border pt-16 lg:grid-cols-12 lg:pt-24">
        <Reveal className="lg:col-span-4">
          <span className="eyebrow">{tc(pressKit.eyebrow)}</span>
          <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h3)" }}>
            {tc(pressKit.heading)}
          </h2>
        </Reveal>

        <div className="lg:col-span-7 lg:col-start-6">
          <Reveal>
            <p className="max-w-2xl leading-relaxed text-fg-muted" style={{ fontSize: "var(--font-size-body)" }}>
              {tc(pressKit.bio)}
            </p>
          </Reveal>
          {pressKit.downloadsNote && (
            <Reveal delay={0.1} className="mt-8">
              <span className="text-xs uppercase tracking-[0.2em] text-fg-muted">{tc(pressKit.downloadsNote)}</span>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

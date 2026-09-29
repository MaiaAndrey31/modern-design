"use client";

import type { PressDto } from "@/lib/content/dto";
import { Reveal } from "@/components/Reveal";
import { track } from "@/lib/analytics";
import { useLocale } from "@/i18n/LocaleProvider";

/**
 * Editorial index — date · publication · headline · READ ↗, one hairline per
 * row. Hover nudges the headline and swaps the arrow; nothing card-like.
 */
export function Press({ items }: { items: PressDto[] }) {
  const { t } = useLocale();

  return (
    <section aria-label={t.press.eyebrow} className="relative py-[var(--section-padding-y)]">
      <div className="container-edit">
        <Reveal className="mb-14 md:mb-20">
          <span className="eyebrow">{t.press.eyebrow}</span>
          <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
            {t.press.heading}
          </h2>
        </Reveal>

        {items.length === 0 ? (
          <Reveal>
            <div className="grid grid-cols-1 gap-4 border-y border-border py-8 md:grid-cols-12 md:items-center">
              <span aria-hidden="true" className="tabular font-display text-fg-muted md:col-span-2">—</span>
              <p className="max-w-lg text-fg-muted md:col-span-10" style={{ fontSize: "var(--font-size-body)" }}>
                {t.press.empty}
              </p>
            </div>
          </Reveal>
        ) : (
          <ul className="border-t border-border">
            {items.map((item) => {
              const row = (
                <>
                  <span className="tabular text-xs uppercase tracking-[0.2em] text-fg-muted md:col-span-2">{item.date}</span>
                  <span className="eyebrow md:col-span-3">{item.outlet}</span>
                  <span className="md:col-span-6">
                    <span className="block font-display text-xl uppercase leading-tight tracking-tight transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:text-2xl">
                      {item.title}
                    </span>
                    {item.excerpt && <span className="mt-2 block max-w-xl text-sm text-fg-muted">{item.excerpt}</span>}
                  </span>
                  {item.url && (
                    <span className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-fg transition-colors group-hover:text-accent md:col-span-1 md:justify-end">
                      {t.press.read}
                      <span className="arrow-swap" aria-hidden="true">
                        <span>↗</span>
                        <span>↗</span>
                      </span>
                    </span>
                  )}
                </>
              );
              const cls = "group grid grid-cols-1 gap-2 py-7 md:grid-cols-12 md:items-baseline md:gap-6 md:py-9";
              return (
                <li key={item.id} className="border-b border-border">
                  <Reveal y={20}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" onClick={() => track("press_click")} className={cls} data-cursor="open">
                        {row}
                        <span className="sr-only">{t.newTab}</span>
                      </a>
                    ) : (
                      <div className={cls}>{row}</div>
                    )}
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

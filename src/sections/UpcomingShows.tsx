"use client";

import type { ShowDto } from "@/lib/content/dto";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { scrollToSection } from "@/lib/lenisStore";
import { track } from "@/lib/analytics";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/dictionary";

/** `date` is always "YYYY-MM-DD" (see ShowDto) — parsed as a local date, never shifted by timezone. */
function dateParts(dateStr: string, locale: Locale) {
  const date = new Date(`${dateStr}T00:00:00`);
  const tag = locale === "pt" ? "pt-BR" : "en-US";
  return {
    month: date.toLocaleDateString(tag, { month: "short" }).replace(".", "").toUpperCase(),
    day: date.toLocaleDateString(tag, { day: "2-digit" }),
    year: date.getFullYear(),
  };
}

/**
 * Agenda as a premium list: stacked month/day, city in display type, venue,
 * and an arrow. Hover shifts the city a few pixels and draws a bronze rule.
 * Presentation only — which shows appear (and their order) is unchanged.
 */
export function UpcomingShows({ shows }: { shows: ShowDto[] }) {
  const { t, locale } = useLocale();

  return (
    <section id="shows" aria-label={t.shows.eyebrow} className="relative py-[var(--section-padding-y)]">
      <div className="container-edit">
        <Reveal className="mb-14 md:mb-20">
          <span className="eyebrow">{t.shows.eyebrow}</span>
          <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
            {t.shows.heading}
          </h2>
        </Reveal>

        {shows.length === 0 ? (
          <Reveal>
            <div className="flex flex-col gap-6 border-y border-border py-10 md:flex-row md:items-center md:justify-between">
              <p className="max-w-md text-fg-muted" style={{ fontSize: "var(--font-size-body)" }}>
                {t.shows.empty}
              </p>
              <MagneticButton className="inline-block" cursorVariant="go" strength={0.2}>
                <button onClick={() => scrollToSection("booking")} className="group flex min-h-11 items-center gap-3 text-xs uppercase tracking-[0.16em] text-accent sm:tracking-[0.25em]">
                  <span className="text-roll" data-text={t.shows.bookCta}>
                    <span>{t.shows.bookCta}</span>
                  </span>
                  <span aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                    →
                  </span>
                </button>
              </MagneticButton>
            </div>
          </Reveal>
        ) : (
          <ul className="border-t border-border">
            {shows.map((show) => {
              const { month, day, year } = dateParts(show.date, locale);
              return (
                <li key={show.id} className="group relative border-b border-border">
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-accent transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                  <Reveal y={20}>
                    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-4 gap-y-1 py-6 md:grid-cols-12 md:gap-6 md:py-8">
                      <time dateTime={show.date} className="flex flex-col leading-none md:col-span-1">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-fg-muted">{month}</span>
                        <span className="tabular mt-1 font-display text-3xl md:text-4xl">{day}</span>
                        <span className="sr-only">{year}</span>
                      </time>
                      <span className="md:col-span-5">
                        <span className="block font-display text-xl uppercase tracking-tight transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:text-3xl">
                          {show.city}
                        </span>
                        {show.title && <span className="mt-1 block text-sm text-fg-muted">{show.title}</span>}
                      </span>
                      <span className="col-start-2 text-sm text-fg-muted md:col-span-4 md:col-start-auto">
                        {show.venue}
                        {show.country ? `, ${show.country}` : ""}
                      </span>
                      <span className="col-start-3 row-start-1 md:col-span-2 md:col-start-auto md:row-start-auto md:text-right">
                        {show.soldOut ? (
                          <span className="text-xs uppercase tracking-[0.2em] text-fg-muted">{t.shows.soldOut}</span>
                        ) : show.ticketUrl ? (
                          <a
                            href={show.ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => track("show_click")}
                            data-cursor="open"
                            className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.25em] text-fg transition-colors group-hover:text-accent"
                          >
                            <span className="hidden md:inline">{t.shows.tickets}</span>
                            <span aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                              →
                            </span>
                            <span className="sr-only md:hidden">{t.shows.tickets}</span>
                            <span className="sr-only">{t.newTab}</span>
                          </a>
                        ) : null}
                      </span>
                    </div>
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

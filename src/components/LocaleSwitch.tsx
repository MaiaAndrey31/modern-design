"use client";

import { LOCALES } from "@/i18n/dictionary";
import { useLocale } from "@/i18n/LocaleProvider";

/**
 * PT / EN toggle. A bronze hairline hands over from one option to the other:
 * the old one retracts to the right while the new one draws in from the left
 * (transform only) — the rest stays typographic.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div role="group" aria-label={t.language} className={`flex items-center ${className ?? ""}`}>
      {LOCALES.map((code, i) => {
        const isActive = locale === code;
        return (
          <span key={code} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-1 text-[10px] text-fg-muted/70">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={isActive}
              lang={code === "pt" ? "pt-BR" : "en"}
              className={`relative flex min-h-11 min-w-9 items-center justify-center text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isActive ? "text-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              {code}
              <span
                aria-hidden="true"
                className={`absolute bottom-2 left-1/2 h-px w-4 -translate-x-1/2 bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                  isActive ? "scale-x-100 origin-left" : "scale-x-0 origin-right"
                }`}
              />
            </button>
          </span>
        );
      })}
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { dictionaries, translateContent, type Dictionary, type Locale } from "@/i18n/dictionary";

const STORAGE_KEY = "as-locale";
const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt") return stored;
  } catch {
    // Storage blocked (private mode etc.) — fall through to the browser language.
  }
  return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  /** Translates CMS copy when a known rendering exists; otherwise returns it untouched. */
  tc: (text: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Visual-only PT/EN switch. The server always renders English (unchanged
 * HTML, metadata and URLs — nothing SEO-facing moves); the visitor's choice
 * lives in localStorage and is applied after hydration, while the preloader
 * still covers the page, so there's no visible language flash.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribe, readLocale, () => "en");

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-persistent fallback is fine — the notify below still switches this tab.
    }
    listeners.forEach((listener) => listener());
  }, []);

  // Keeps screen readers pronouncing the visible language correctly.
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
      tc: (text: string) => translateContent(text, locale),
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

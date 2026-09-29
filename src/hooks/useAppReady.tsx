"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface AppReadyContextValue {
  isReady: boolean;
  setReady: () => void;
}

const AppReadyContext = createContext<AppReadyContextValue | null>(null);

/**
 * Tracks whether the preloader has finished, so the Hero's entrance timeline
 * can start exactly when the preloader hands off — the two "talk" to each
 * other instead of racing independently.
 */
export function AppReadyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const value = useMemo(() => ({ isReady, setReady: () => setIsReady(true) }), [isReady]);
  return <AppReadyContext.Provider value={value}>{children}</AppReadyContext.Provider>;
}

export function useAppReady() {
  const ctx = useContext(AppReadyContext);
  if (!ctx) throw new Error("useAppReady must be used within AppReadyProvider");
  return ctx;
}

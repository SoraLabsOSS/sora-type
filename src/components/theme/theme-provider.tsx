"use client";

import { Theme } from "@astryxdesign/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  isThemeMode,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme/constants";
import { readDomResolvedTheme } from "@/lib/theme/theme-init-script";
import { matchaTheme } from "@/themes/matcha/matcha";

interface ThemeModeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => {
    media.removeEventListener("change", onStoreChange);
  };
}

function getSystemThemeSnapshot(): ResolvedTheme {
  return readDomResolvedTheme();
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return "light";
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) {
      return stored;
    }
  } catch {
    // Private browsing or disabled storage.
  }
  return "system";
}

export function MatchaThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  useLayoutEffect(() => {
    setModeState(readStoredMode());
    setMounted(true);
  }, []);

  const resolvedTheme: ResolvedTheme = mode === "system" ? systemTheme : mode;

  // Before storage is read, keep Astryx Theme aligned with the blocking script
  // on <html> so hydration does not strip data-theme and flash the wrong mode.
  const astryxMode: ResolvedTheme = mounted
    ? resolvedTheme
    : readDomResolvedTheme();

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme, setMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <Theme mode={astryxMode} theme={matchaTheme}>
        {children}
      </Theme>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within MatchaThemeProvider");
  }
  return context;
}

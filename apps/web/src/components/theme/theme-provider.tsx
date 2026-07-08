"use client";

import { Theme } from "@astryxdesign/core";
import {
  type CSSProperties,
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

function resolveTheme(
  mode: ThemeMode,
  systemTheme: ResolvedTheme
): ResolvedTheme {
  return mode === "system" ? systemTheme : mode;
}

/** Keeps `color-scheme` + `light-dark()` tokens aligned even if Theme SSR/hydration drifts. */
function ThemeSurface({
  children,
  resolvedTheme,
}: {
  children: ReactNode;
  resolvedTheme: ResolvedTheme;
}) {
  const surfaceStyle = useMemo(
    () =>
      ({
        colorScheme: resolvedTheme,
        display: "flex",
        flex: 1,
        minHeight: 0,
        flexDirection: "column",
      }) satisfies CSSProperties,
    [resolvedTheme]
  );

  return <div style={surfaceStyle}>{children}</div>;
}

export function MatchaThemeProvider({ children }: { children: ReactNode }) {
  // Keep the first render identical on server and client. Reading localStorage in
  // useState would resolve to "dark" on the client while SSR stays "system" →
  // hydration mismatch on Astryx Theme's data-theme. theme-init-script already
  // sets <html data-theme> before paint; sync stored mode here before paint.
  const [mode, setModeState] = useState<ThemeMode>("system");
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolvedTheme = resolveTheme(mode, systemTheme);

  useLayoutEffect(() => {
    setModeState(readStoredMode());
  }, []);

  // Always pass an explicit light|dark mode to Astryx Theme (never "system") so
  // useRootThemeSync keeps data-theme on <html> and Tailwind light-dark() tokens
  // resolve consistently with the toggle state.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

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
      <Theme mode={resolvedTheme} theme={matchaTheme}>
        <ThemeSurface resolvedTheme={resolvedTheme}>{children}</ThemeSurface>
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

export const THEME_STORAGE_KEY = "sora-type-theme";

export type ThemeMode = "dark" | "light" | "system";

export type ResolvedTheme = "dark" | "light";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

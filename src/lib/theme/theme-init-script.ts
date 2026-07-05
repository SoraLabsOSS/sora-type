import { THEME_STORAGE_KEY } from "@/lib/theme/constants";

/**
 * Blocking script for the root layout `<head>`. Runs before first paint so
 * `light-dark()` tokens and `color-scheme` match stored / system preference
 * before React hydrates. Must stay in sync with MatchaThemeProvider.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var m=localStorage.getItem(k);var r="light";if(m==="dark"){r="dark";}else if(m!=="light"){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",r);}catch(e){}})();`;

export function readDomResolvedTheme(): "dark" | "light" {
  if (typeof document === "undefined") {
    return "light";
  }

  const fromDom = document.documentElement.getAttribute("data-theme");
  if (fromDom === "dark" || fromDom === "light") {
    return fromDom;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

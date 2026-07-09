export interface RecentFont {
  detectedAt: number;
  family: string;
  pageTitle: string;
  pageUrl: string;
}

export const MAX_RECENT_FONTS = 20;

/** Whether the on-page font picker is armed. UI-only for now — the content
 * script doesn't read this yet. */
export const pickerEnabled = storage.defineItem<boolean>(
  "local:pickerEnabled",
  { fallback: false }
);

/** Most-recently-inspected fonts, newest first. Populated once the picker's
 * content-script logic lands; empty until then. */
export const recentFonts = storage.defineItem<RecentFont[]>(
  "local:recentFonts",
  { fallback: [] }
);

/** One-shot tab to show when the side panel opens (e.g. from popup "Load"). */
export const sidePanelInitialTab = storage.defineItem<"page" | "recent" | null>(
  "session:sidePanelInitialTab",
  { fallback: null }
);

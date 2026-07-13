export interface RecentFont {
  detectedAt: number;
  family: string;
  /** The frame (within `pageUrl`'s tab) the font was picked from — 0 is the
   * top frame. Needed to re-target `loadFontSummary` at the right frame
   * when a font was picked from inside an iframe. */
  frameId: number;
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

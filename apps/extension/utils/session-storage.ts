/** One-shot tab to show when the side panel opens (e.g. from popup "Load").
 * Kept out of `utils/storage.ts` deliberately: `storage.defineItem` reads its
 * value eagerly at definition time, and this is a `session:` item —
 * `chrome.storage.session` is trusted-context-only by default. Bundling it
 * alongside `local:` items that the content script also imports (e.g.
 * `pickerEnabled`) would pull this definition into the content script too,
 * throwing "Access to storage is not allowed from this context" on every
 * frame load. This item is only ever consumed by background/side-panel
 * (trusted) contexts. */
export const sidePanelInitialTab = storage.defineItem<"page" | "recent" | null>(
  "session:sidePanelInitialTab",
  { fallback: null }
);

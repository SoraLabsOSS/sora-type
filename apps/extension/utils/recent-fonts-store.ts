import { onMessage } from "./messaging";
import { createSerialQueue } from "./serial-queue";
import { MAX_RECENT_FONTS, recentFonts } from "./storage";

// Serializes reads/writes against the single shared `recentFonts` blob so
// two near-simultaneous picks can't race (handler A reading `current`
// before B's write lands, then A's write clobbering B's entry).
const queue = createSerialQueue();

/**
 * Wires up `saveRecentFont`. Kept in the background (rather than a direct
 * `recentFonts.setValue()` write from the content script) so `pageUrl`/
 * `pageTitle`/`frameId` are read from the message's `sender` info — the
 * tab's real top-level URL/title, not `location.href`/`document.title` of
 * whichever frame the pick happened in (which would be the iframe's own,
 * not the tab's, for a pick made inside an iframe).
 */
export function setupRecentFontsStore(): void {
  onMessage("saveRecentFont", ({ data, sender }) => {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return;
    }

    return queue.run(async () => {
      const current = await recentFonts.getValue();
      const next = [
        {
          family: data.family,
          frameId: sender.frameId ?? 0,
          pageTitle: sender.tab?.title ?? "",
          pageUrl: sender.tab?.url ?? "",
          detectedAt: Date.now(),
        },
        ...current,
      ].slice(0, MAX_RECENT_FONTS);
      await recentFonts.setValue(next);
    });
  });
}

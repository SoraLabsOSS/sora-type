import { onMessage } from "./messaging";
import { createKeyedSerialQueue } from "./serial-queue";

/** tabId -> known frameIds (0 = top frame), self-reported via `registerFrame`.
 * A fast-path cache in front of `session:frames-*` storage, which is the
 * source of truth that survives this file being reloaded when the MV3
 * background service worker idle-terminates (~30s) and restarts. */
const framesByTab = new Map<number, Set<number>>();

// Keyed by tabId so registering/reading frames for one tab never blocks on
// another, while still serializing same-tab operations against each other —
// necessary once persistence adds an async yield point that same-tick
// `document_idle` content scripts (parent + iframes of one page) can race on.
const frameQueue = createKeyedSerialQueue<number>();

function framesStorageKey(tabId: number): StorageItemKey {
  return `session:frames-${tabId}`;
}

async function getOrHydrateFrames(tabId: number): Promise<Set<number>> {
  const cached = framesByTab.get(tabId);
  if (cached) {
    return cached;
  }
  const stored = await storage.getItem<number[]>(framesStorageKey(tabId));
  const frames = new Set(stored ?? []);
  framesByTab.set(tabId, frames);
  return frames;
}

/**
 * Wires up the frame registry's message listeners and tab-cleanup, so the
 * side panel can ask "which frames exist in this tab" without the
 * `webNavigation` permission. Call once from the background entrypoint.
 */
export function setupFrameRegistry(): void {
  onMessage("registerFrame", ({ sender }) => {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return;
    }
    const frameId = sender.frameId ?? 0;

    return frameQueue.run(tabId, async () => {
      const frames = await getOrHydrateFrames(tabId);
      if (frames.has(frameId)) {
        return;
      }
      frames.add(frameId);
      await storage.setItem(framesStorageKey(tabId), [...frames]);
    });
  });

  onMessage("getKnownFrames", ({ data }) =>
    frameQueue.run(data.tabId, async () => {
      const frames = await getOrHydrateFrames(data.tabId);
      return frames.size > 0 ? [...frames] : [0];
    })
  );

  browser.tabs.onRemoved.addListener((tabId) => {
    framesByTab.delete(tabId);
    frameQueue.delete(tabId);
    storage.removeItem(framesStorageKey(tabId)).catch(() => {
      // Best-effort — nothing meaningful to recover from here.
    });
  });

  // The real "this tab is on a new page" signal — unlike a `frameId===0`
  // registration message, this can't race against a not-yet-arrived iframe
  // registration from the *same* page load, so it's safe to wipe here.
  // Must also clear the persisted key, not just the in-memory cache — a
  // `getKnownFrames` racing with navigation-start would otherwise rehydrate
  // from the stale persisted list, silently resurrecting the exact bug this
  // reset fixes via the storage layer instead.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== "loading") {
      return;
    }
    framesByTab.delete(tabId);
    frameQueue
      .run(tabId, () => storage.removeItem(framesStorageKey(tabId)))
      .catch(() => {
        // Best-effort — nothing meaningful to recover from here.
      });
  });
}

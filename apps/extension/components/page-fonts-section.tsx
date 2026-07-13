import { TriangleAlert, Type } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { i18n } from "#i18n";
import { FontRow } from "@/components/font-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { LoadFontSummaryResult } from "@/utils/load-font-summary";
import { sendMessage } from "@/utils/messaging";
import {
  mergeFrameFontSummaries,
  type PageFontSummary,
} from "@/utils/scan-page-fonts";

type ScanStatus = "loading" | "ready" | "unavailable";

const SKELETON_ROW_KEYS = ["a", "b", "c", "d"] as const;

function PageFontsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {SKELETON_ROW_KEYS.map((key) => (
        <Skeleton className="h-16 w-full" key={key} />
      ))}
    </div>
  );
}

export function PageFontsSection({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  const [status, setStatus] = useState<ScanStatus>("loading");
  const [fonts, setFonts] = useState<PageFontSummary[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);
  // The browser window this side panel instance belongs to — tab listeners
  // below fire for every window, so this scopes rescans to our own window
  // instead of hijacking `tabId` when the user switches tabs elsewhere.
  const windowIdRef = useRef<number | null>(null);
  // Which frame(s) reported each family in the most recent scan, so
  // onLoadSummary can target the right frame instead of guessing.
  const familyFrameIndexRef = useRef<Map<string, number[]>>(new Map());
  // Guards against out-of-order resolution: switching tabs quickly (or even
  // rescanning the same tab twice, e.g. two "complete" tabs.onUpdated events
  // for one navigation) starts a new scan before the previous one settles,
  // and nothing otherwise stops the slower, now-stale scan from overwriting
  // the UI after a faster, newer one already committed. A monotonic token
  // (not just the target tabId) is required — two overlapping scans for the
  // *same* tabId would otherwise both look "current" to an id-only check.
  const scanTokenRef = useRef(0);

  const scan = useCallback(async (id: number) => {
    const token = ++scanTokenRef.current;
    setStatus("loading");
    try {
      const frameIds = await sendMessage("getKnownFrames", { tabId: id });
      const settled = await Promise.allSettled(
        frameIds.map((frameId) =>
          sendMessage("scanPageFonts", undefined, { tabId: id, frameId })
        )
      );

      if (scanTokenRef.current !== token) {
        // Superseded by a newer scan while these were in flight.
        return;
      }

      const index = new Map<string, number[]>();
      const perFrame: PageFontSummary[][] = [];
      for (const [i, result] of settled.entries()) {
        if (result.status !== "fulfilled") {
          continue;
        }
        perFrame.push(result.value);
        for (const { family } of result.value) {
          index.set(family, [...(index.get(family) ?? []), frameIds[i]]);
        }
      }

      if (perFrame.length === 0 && frameIds.length > 0) {
        // Every known frame's scan rejected (e.g. content script never
        // loaded on a restricted page) — Promise.allSettled never rejects,
        // so without this check we'd silently fall through to "ready" with
        // zero fonts, which looks identical to a genuinely font-less page.
        familyFrameIndexRef.current = new Map();
        setFonts([]);
        setStatus("unavailable");
        return;
      }

      familyFrameIndexRef.current = index;
      setFonts(mergeFrameFontSummaries(perFrame));
      setStatus("ready");
    } catch {
      if (scanTokenRef.current !== token) {
        return;
      }
      setFonts([]);
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    async function scanActiveTab() {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id === undefined) {
        return;
      }
      windowIdRef.current = tab.windowId ?? null;
      setTabId(tab.id);
      await scan(tab.id);
    }

    scanActiveTab();

    function handleActivated(info: { tabId: number; windowId: number }) {
      if (info.windowId !== windowIdRef.current) {
        return;
      }
      setTabId(info.tabId);
      scan(info.tabId);
    }

    function handleUpdated(
      updatedTabId: number,
      changeInfo: { status?: string },
      tab: { active?: boolean; windowId?: number }
    ) {
      if (
        changeInfo.status === "complete" &&
        tab.active &&
        tab.windowId === windowIdRef.current
      ) {
        setTabId(updatedTabId);
        scan(updatedTabId);
      }
    }

    browser.tabs.onActivated.addListener(handleActivated);
    browser.tabs.onUpdated.addListener(handleUpdated);

    return () => {
      browser.tabs.onActivated.removeListener(handleActivated);
      browser.tabs.onUpdated.removeListener(handleUpdated);
    };
  }, [scan]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      {showHeading ? (
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">
            {i18n.t("sidepanel.pageFonts.heading")}
          </h2>
          <Button
            disabled={tabId === null || status === "loading"}
            onClick={() => tabId !== null && scan(tabId)}
            size="xs"
            type="button"
            variant="link"
          >
            {status === "loading" ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="size-3" />
                {i18n.t("sidepanel.pageFonts.rescan")}
              </span>
            ) : (
              i18n.t("sidepanel.pageFonts.rescan")
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            disabled={tabId === null || status === "loading"}
            onClick={() => tabId !== null && scan(tabId)}
            size="xs"
            type="button"
            variant="link"
          >
            {status === "loading" ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="size-3" />
                {i18n.t("sidepanel.pageFonts.rescan")}
              </span>
            ) : (
              i18n.t("sidepanel.pageFonts.rescan")
            )}
          </Button>
        </div>
      )}

      {status === "unavailable" ? (
        <Alert>
          <TriangleAlert />
          <AlertDescription>
            {i18n.t("sidepanel.pageFonts.unavailable")}
          </AlertDescription>
        </Alert>
      ) : null}

      {status === "loading" && fonts.length === 0 ? (
        <PageFontsSkeleton />
      ) : null}

      {status === "ready" && fonts.length === 0 ? (
        <Empty className="border border-dashed py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Type />
            </EmptyMedia>
            <EmptyTitle>{i18n.t("sidepanel.pageFonts.heading")}</EmptyTitle>
            <EmptyDescription>
              {i18n.t("sidepanel.pageFonts.empty")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {fonts.length > 0 && tabId !== null ? (
        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <ItemGroup className="min-w-0 gap-2 pr-3">
            {fonts.map((font) => (
              <FontRow
                badge={font.elementCount}
                family={font.family}
                key={font.family}
                onLoadSummary={async () => {
                  const candidates = familyFrameIndexRef.current.get(
                    font.family
                  ) ?? [0];
                  let lastResult: LoadFontSummaryResult | null = null;
                  for (const frameId of candidates) {
                    try {
                      const result = await sendMessage(
                        "loadFontSummary",
                        { family: font.family },
                        { tabId, frameId }
                      );
                      if (result.status === "loaded") {
                        return result;
                      }
                      lastResult = result;
                    } catch {
                      // Try the next candidate frame.
                    }
                  }
                  return lastResult ?? { status: "tab-not-found" as const };
                }}
              />
            ))}
          </ItemGroup>
        </ScrollArea>
      ) : null}
    </div>
  );
}

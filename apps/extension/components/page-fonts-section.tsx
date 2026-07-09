import { TriangleAlert, Type } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { sendMessage } from "@/utils/messaging";
import type { PageFontSummary } from "@/utils/scan-page-fonts";

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

  const scan = useCallback(async (id: number) => {
    setStatus("loading");
    try {
      const result = await sendMessage("scanPageFonts", undefined, id);
      setFonts(result);
      setStatus("ready");
    } catch {
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
      setTabId(tab.id);
      await scan(tab.id);
    }

    scanActiveTab();

    function handleActivated(info: { tabId: number }) {
      setTabId(info.tabId);
      scan(info.tabId);
    }

    function handleUpdated(
      updatedTabId: number,
      changeInfo: { status?: string },
      tab: { active?: boolean }
    ) {
      if (changeInfo.status === "complete" && tab.active) {
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
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
        <ScrollArea className="min-h-0 flex-1">
          <ItemGroup className="gap-2 pr-3">
            {fonts.map((font) => (
              <FontRow
                badge={font.elementCount}
                family={font.family}
                key={font.family}
                onLoadSummary={() =>
                  sendMessage("loadFontSummary", { family: font.family }, tabId)
                }
              />
            ))}
          </ItemGroup>
        </ScrollArea>
      ) : null}
    </div>
  );
}

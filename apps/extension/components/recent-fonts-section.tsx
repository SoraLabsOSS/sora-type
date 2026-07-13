import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { i18n } from "#i18n";
import { FontRow } from "@/components/font-row";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendMessage } from "@/utils/messaging";
import type { RecentFont } from "@/utils/storage";
import { recentFonts } from "@/utils/storage";

async function findTabForUrl(url: string) {
  const tabs = await browser.tabs.query({});
  return tabs.find((tab) => tab.url === url);
}

export function RecentFontsSection({
  emptyMessage,
  heading,
  limit,
  loadAction = "inline",
  showHeading = true,
}: {
  emptyMessage?: string;
  heading?: string;
  limit?: number;
  loadAction?: "inline" | "side-panel";
  showHeading?: boolean;
}) {
  const [fonts, setFonts] = useState<RecentFont[]>([]);
  const resolvedEmptyMessage =
    emptyMessage ?? i18n.t("sidepanel.recentlyInspected.empty");
  const resolvedHeading =
    heading ?? i18n.t("sidepanel.recentlyInspected.heading");

  useEffect(() => {
    recentFonts.getValue().then(setFonts);
    return recentFonts.watch(setFonts);
  }, []);

  const visibleFonts = limit === undefined ? fonts : fonts.slice(0, limit);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showHeading ? (
        <h2 className="font-medium text-sm">{resolvedHeading}</h2>
      ) : null}

      {visibleFonts.length === 0 ? (
        <Empty className="border border-dashed py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>{resolvedHeading}</EmptyTitle>
            <EmptyDescription>{resolvedEmptyMessage}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea
          className={limit === undefined ? "min-h-0 flex-1" : "max-h-48"}
        >
          <ItemGroup className="gap-2 pr-3">
            {visibleFonts.map((font) => (
              <FontRow
                description={font.pageTitle}
                family={font.family}
                key={`${font.family}-${font.detectedAt}`}
                loadAction={loadAction}
                onLoadSummary={async () => {
                  const tab = await findTabForUrl(font.pageUrl);
                  if (tab?.id === undefined) {
                    return { status: "tab-not-found" as const };
                  }
                  try {
                    return await sendMessage(
                      "loadFontSummary",
                      { family: font.family },
                      // `?? 0`: entries saved before frameId tracking was
                      // added won't have it in persisted storage.
                      { tabId: tab.id, frameId: font.frameId ?? 0 }
                    );
                  } catch {
                    return { status: "tab-not-found" as const };
                  }
                }}
              />
            ))}
          </ItemGroup>
        </ScrollArea>
      )}
    </div>
  );
}

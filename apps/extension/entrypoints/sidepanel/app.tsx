import { useCallback, useEffect, useState } from "react";
import { RecentFontRow } from "@/components/recent-font-row";
import type { LoadFontSummaryResult } from "@/utils/load-font-summary";
import { sendMessage } from "@/utils/messaging";
import type { PageFontSummary } from "@/utils/scan-page-fonts";
import { type RecentFont, recentFonts } from "@/utils/storage";

const SORA_TYPE_URL = "https://type.soralabs.io.vn";

type ScanStatus = "loading" | "ready" | "unavailable";
type RowState =
  | { status: "idle" }
  | { status: "loading" }
  | LoadFontSummaryResult;

function PageFontRow({
  font,
  tabId,
}: {
  font: PageFontSummary;
  tabId: number;
}) {
  const [state, setState] = useState<RowState>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    const result = await sendMessage(
      "loadFontSummary",
      { family: font.family },
      tabId
    );
    setState(result);
  }

  return (
    <li className="flex flex-col gap-1 rounded-md border border-[#88888833] p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{font.family}</span>
        <span className="text-[#888] text-xs">{font.elementCount}</span>
      </div>

      {state.status === "idle" && (
        <button
          className="cursor-pointer self-start text-[#646cff] text-xs hover:underline"
          onClick={load}
          type="button"
        >
          Load real font name
        </button>
      )}
      {state.status === "loading" && (
        <p className="text-[#888] text-xs">Loading…</p>
      )}
      {state.status === "not-found" && (
        <p className="text-[#888] text-xs">
          Couldn't find this font's file (system font, or a cross-origin
          stylesheet blocked from being read).
        </p>
      )}
      {state.status === "error" && (
        <p className="text-[#888] text-xs">{state.message}</p>
      )}
      {state.status === "loaded" && (
        <div className="flex flex-col gap-1 border-[#88888833] border-t pt-1">
          {state.fields.map((field) => (
            <div
              className="flex justify-between gap-2 text-xs"
              key={field.label}
            >
              <span className="text-[#888]">{field.label}</span>
              <span className="truncate text-right">{field.value}</span>
            </div>
          ))}
          <a
            className="mt-1 text-[#646cff] text-xs hover:underline"
            href={`${SORA_TYPE_URL}/?inspectUrl=${encodeURIComponent(state.fontUrl)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in Sora Type →
          </a>
        </div>
      )}
    </li>
  );
}

function PageFonts() {
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
      // No content script listening — chrome:// pages, the extension's own
      // pages, or a tab that hasn't finished loading yet.
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
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Fonts on this page</h2>
        <button
          className="cursor-pointer text-[#646cff] text-xs hover:underline disabled:cursor-default disabled:opacity-50"
          disabled={tabId === null || status === "loading"}
          onClick={() => tabId !== null && scan(tabId)}
          type="button"
        >
          Rescan
        </button>
      </div>

      {status === "unavailable" && (
        <p className="text-[#888] text-sm">Can't scan this page.</p>
      )}
      {status === "loading" && fonts.length === 0 && (
        <p className="text-[#888] text-sm">Scanning…</p>
      )}
      {status === "ready" && fonts.length === 0 && (
        <p className="text-[#888] text-sm">No text found on this page.</p>
      )}
      {fonts.length > 0 && tabId !== null && (
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {fonts.map((font) => (
            <PageFontRow font={font} key={font.family} tabId={tabId} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentlyInspected() {
  const [fonts, setFonts] = useState<RecentFont[]>([]);

  useEffect(() => {
    recentFonts.getValue().then(setFonts);
    return recentFonts.watch(setFonts);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="font-medium text-sm">Recently inspected</h2>
      {fonts.length === 0 ? (
        <p className="text-[#888] text-sm">No fonts inspected yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {fonts.map((font) => (
            <RecentFontRow
              font={font}
              key={`${font.family}-${font.detectedAt}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="flex h-screen flex-col gap-4 p-4">
      <h1 className="font-semibold text-lg">Sora Type</h1>
      <PageFonts />
      <RecentlyInspected />
    </div>
  );
}

export default App;

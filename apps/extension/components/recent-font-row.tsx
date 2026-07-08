import { useState } from "react";
import type { LoadFontSummaryResult } from "@/utils/load-font-summary";
import { sendMessage } from "@/utils/messaging";
import type { RecentFont } from "@/utils/storage";

const SORA_TYPE_URL = "https://type.soralabs.io.vn";

type RowState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "tab-not-found" }
  | LoadFontSummaryResult;

async function findTabForUrl(url: string) {
  const tabs = await browser.tabs.query({});
  return tabs.find((tab) => tab.url === url);
}

export function RecentFontRow({ font }: { font: RecentFont }) {
  const [state, setState] = useState<RowState>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    const tab = await findTabForUrl(font.pageUrl);
    if (tab?.id === undefined) {
      setState({ status: "tab-not-found" });
      return;
    }
    try {
      const result = await sendMessage(
        "loadFontSummary",
        { family: font.family },
        tab.id
      );
      setState(result);
    } catch {
      setState({ status: "tab-not-found" });
    }
  }

  return (
    <li className="flex flex-col gap-1 rounded-md border border-[#88888833] p-2 text-sm">
      <p className="font-medium">{font.family}</p>
      <p className="truncate text-[#888]">{font.pageTitle}</p>

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
      {state.status === "tab-not-found" && (
        <p className="text-[#888] text-xs">
          Open this page in a tab to load its real font.
        </p>
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

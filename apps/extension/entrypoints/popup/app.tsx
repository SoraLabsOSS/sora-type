import { useEffect, useState } from "react";
import { pickerEnabled, type RecentFont, recentFonts } from "@/utils/storage";

const SORA_TYPE_URL = "https://type.soralabs.io.vn";
// The popup is a quick-glance surface, not the full history — show a
// handful and point to the side panel (which has room to scroll) for more.
const POPUP_RECENT_PREVIEW_COUNT = 5;

function PickerToggle() {
  const [enabled, setEnabled] = useState(false);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    pickerEnabled.getValue().then(setEnabled);
    return pickerEnabled.watch(setEnabled);
  }, []);

  useEffect(() => {
    browser.commands.getAll().then((commands) => {
      const toggle = commands.find((c) => c.name === "toggle-picker");
      setShortcut(toggle?.shortcut || null);
    });
  }, []);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#88888833] p-3">
      <span className="flex flex-col">
        <span className="font-medium text-sm">Font picker</span>
        <span className="text-[#888] text-xs">
          Click any text on the page to inspect its font
          {shortcut ? ` · shortcut: ${shortcut}` : null}
        </span>
      </span>
      <input
        checked={enabled}
        className="h-5 w-9 cursor-pointer accent-[#646cff]"
        onChange={(event) => pickerEnabled.setValue(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function RecentFontsList() {
  const [fonts, setFonts] = useState<RecentFont[]>([]);

  useEffect(() => {
    recentFonts.getValue().then(setFonts);
    return recentFonts.watch(setFonts);
  }, []);

  if (fonts.length === 0) {
    return (
      <p className="text-[#888] text-sm">
        No fonts inspected yet — turn on the picker and click some text.
      </p>
    );
  }

  return (
    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
      {fonts.slice(0, POPUP_RECENT_PREVIEW_COUNT).map((font) => (
        <li
          className="rounded-md border border-[#88888833] p-2 text-sm"
          key={`${font.family}-${font.detectedAt}`}
        >
          <p className="font-medium">{font.family}</p>
          <p className="truncate text-[#888] text-xs">{font.pageTitle}</p>
        </li>
      ))}
    </ul>
  );
}

function openSidePanel() {
  browser.windows.getCurrent().then((win) => {
    if (win.id === undefined) {
      return;
    }
    browser.sidePanel?.open({ windowId: win.id });
  });
}

function openSoraType() {
  browser.tabs.create({ url: SORA_TYPE_URL });
}

function App() {
  return (
    <div className="flex w-80 flex-col gap-4 p-4">
      <h1 className="font-semibold text-lg">Sora Type</h1>

      <PickerToggle />

      <div className="flex flex-col gap-2">
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-4 py-2 font-medium text-sm transition-colors hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-[#646cff] dark:bg-[#1a1a1a]"
          onClick={openSidePanel}
          type="button"
        >
          Open side panel
        </button>
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-4 py-2 font-medium text-sm transition-colors hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-[#646cff] dark:bg-[#1a1a1a]"
          onClick={openSoraType}
          type="button"
        >
          Open Sora Type
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-sm">Recent fonts</h2>
        <RecentFontsList />
      </div>
    </div>
  );
}

export default App;

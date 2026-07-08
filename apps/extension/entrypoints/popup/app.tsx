import { useEffect, useState } from "react";
import { i18n } from "#i18n";
import { RecentFontRow } from "@/components/recent-font-row";
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
        <span className="font-medium text-sm">
          {i18n.t("popup.pickerLabel")}
        </span>
        <span className="text-[#888] text-xs">
          {shortcut
            ? i18n.t("popup.pickerShortcutHint", { shortcut })
            : i18n.t("popup.pickerHint")}
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
      <p className="text-[#888] text-sm">{i18n.t("popup.recentFontsEmpty")}</p>
    );
  }

  return (
    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
      {fonts.slice(0, POPUP_RECENT_PREVIEW_COUNT).map((font) => (
        <RecentFontRow font={font} key={`${font.family}-${font.detectedAt}`} />
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
      <h1 className="font-semibold text-lg">{i18n.t("popup.title")}</h1>

      <PickerToggle />

      <div className="flex flex-col gap-2">
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-4 py-2 font-medium text-sm transition-colors hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-[#646cff] dark:bg-[#1a1a1a]"
          onClick={openSidePanel}
          type="button"
        >
          {i18n.t("popup.openSidePanel")}
        </button>
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-4 py-2 font-medium text-sm transition-colors hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-[#646cff] dark:bg-[#1a1a1a]"
          onClick={openSoraType}
          type="button"
        >
          {i18n.t("popup.openSoraType")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-sm">
          {i18n.t("popup.recentFontsHeading")}
        </h2>
        <RecentFontsList />
      </div>
    </div>
  );
}

export default App;

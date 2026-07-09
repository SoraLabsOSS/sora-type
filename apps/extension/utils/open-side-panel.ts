import { sidePanelInitialTab } from "@/utils/storage";

const SORA_TYPE_URL = "https://type.soralabs.io.vn";

export async function openSidePanel() {
  const win = await browser.windows.getCurrent();
  if (win.id === undefined) {
    return;
  }
  await browser.sidePanel?.open({ windowId: win.id });
}

export async function openSidePanelToRecent(options?: {
  closePopup?: boolean;
}) {
  await sidePanelInitialTab.setValue("recent");
  await openSidePanel();
  if (options?.closePopup) {
    window.close();
  }
}

export function openSoraType() {
  browser.tabs.create({ url: SORA_TYPE_URL });
}

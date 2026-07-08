import { defineExtensionMessaging } from "@webext-core/messaging";
import type { LoadFontSummaryResult } from "./load-font-summary";
import type { PageFontSummary } from "./scan-page-fonts";

interface ProtocolMap {
  loadFontSummary(data: { family: string }): LoadFontSummaryResult;
  scanPageFonts(): PageFontSummary[];
}

export const { onMessage, sendMessage } =
  defineExtensionMessaging<ProtocolMap>();

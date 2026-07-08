import {
  buildFontSummaryFields,
  extractFontMetadata,
  type FontDetailField,
} from "@sora-type/font-engine/font-metadata";
import { Buffer } from "buffer";
import { create as createFont } from "fontkit";
import { fetchFontFile } from "./fetch-font-file";
import { findFontFaceSource } from "./find-font-face-source";

export type LoadFontSummaryResult =
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "loaded"; fields: FontDetailField[]; fontUrl: string };

function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

/**
 * Locates a font's `@font-face` source, fetches it, and extracts a
 * panel-sized metadata summary. Must run in a context with access to the
 * page's DOM (a content script) — `findFontFaceSource` reads
 * `document.styleSheets`, which isn't available from the popup/side panel.
 */
export async function loadFontSummary(
  family: string
): Promise<LoadFontSummaryResult> {
  const source = findFontFaceSource(family);
  if (!source) {
    return { status: "not-found" };
  }

  try {
    const buffer = await fetchFontFile(source.url);
    const font = createFont(Buffer.from(buffer));
    if ("fonts" in font) {
      // Font collection (.ttc/.dfont) — inspecting a single face isn't
      // supported here yet.
      return {
        status: "error",
        message: "Font collections aren't supported yet.",
      };
    }
    const metadata = extractFontMetadata(font, fileNameFromUrl(source.url));
    return {
      status: "loaded",
      fields: buildFontSummaryFields(metadata),
      fontUrl: source.url,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Couldn't load this font.",
    };
  }
}

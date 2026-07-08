export interface LocalFontEntry {
  fontData: FontData;
  id: string;
  label: string;
}

export function isLocalFontAccessSupported(): boolean {
  return typeof window !== "undefined" && "queryLocalFonts" in window;
}

/**
 * Lists every font installed on the user's system, prompting for the
 * `local-fonts` permission on first call if needed. Rejects with
 * `NotAllowedError` if the user denies the prompt.
 */
export async function loadLocalFonts(): Promise<LocalFontEntry[]> {
  if (!window.queryLocalFonts) {
    throw new Error("Local Font Access API is not supported in this browser");
  }

  const fonts = await window.queryLocalFonts();
  return fonts
    .map((fontData) => ({
      fontData,
      id: fontData.postscriptName || fontData.fullName,
      label: fontData.fullName || fontData.postscriptName,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Reads a locally-installed font's raw bytes, same shape as `File#arrayBuffer()`. */
export async function readLocalFontBuffer(
  fontData: FontData
): Promise<ArrayBuffer> {
  const blob = await fontData.blob();
  return blob.arrayBuffer();
}

const activeFontFaces = new Map<string, FontFace>();

const NON_CSS_IDENT_CHAR_PATTERN = /[^\w-]/g;
const FILE_EXTENSION_PATTERN = /\.[^./]+$/;

/**
 * Loads a font's raw bytes into the browser via the FontFace API, keyed by
 * `slot` so multiple fonts can be registered simultaneously (e.g. two fonts
 * being compared side by side) without evicting each other. Replaces
 * whatever was previously loaded in the same slot.
 */
export async function loadFontFace(
  slot: string,
  familyName: string,
  buffer: ArrayBuffer
): Promise<FontFace> {
  const previous = activeFontFaces.get(slot);
  if (previous) {
    document.fonts.delete(previous);
    activeFontFaces.delete(slot);
  }

  const fontFace = new FontFace(familyName, buffer);
  await fontFace.load();
  document.fonts.add(fontFace);
  activeFontFaces.set(slot, fontFace);
  return fontFace;
}

export function clearFontFace(slot: string): void {
  const previous = activeFontFaces.get(slot);
  if (previous) {
    document.fonts.delete(previous);
    activeFontFaces.delete(slot);
  }
}

/** CSS font-family names can't contain most punctuation; derive a safe,
 * unique-per-slot family name from the uploaded file name. */
export function toCssFontFamily(slot: string, fileName: string): string {
  const base = fileName
    .replace(FILE_EXTENSION_PATTERN, "")
    .replace(NON_CSS_IDENT_CHAR_PATTERN, "-");
  return `sora-type-preview-${slot}-${base}`;
}

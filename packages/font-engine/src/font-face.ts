const activeFontFaces = new Map<string, FontFace>();

const NON_CSS_IDENT_CHAR_PATTERN = /[^\w-]/g;
const FILE_EXTENSION_PATTERN = /\.[^./]+$/;

/**
 * Decodes a font's raw bytes into a `FontFace` without registering it
 * anywhere, so callers that need to guard against stale/superseded loads
 * (e.g. the user dropped a different file before this one finished
 * decoding) can discard the result here, before it's ever visible to
 * `document.fonts`.
 */
export async function decodeFontFace(
  familyName: string,
  buffer: ArrayBuffer
): Promise<FontFace> {
  const fontFace = new FontFace(familyName, buffer);
  await fontFace.load();
  return fontFace;
}

/**
 * Registers an already-decoded `FontFace` into `document.fonts`, keyed by
 * `slot` so multiple fonts can be registered simultaneously (e.g. two fonts
 * being compared side by side) without evicting each other. Replaces
 * whatever was previously loaded in the same slot.
 */
export function registerFontFace(slot: string, fontFace: FontFace): void {
  const previous = activeFontFaces.get(slot);
  if (previous) {
    document.fonts.delete(previous);
  }
  document.fonts.add(fontFace);
  activeFontFaces.set(slot, fontFace);
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

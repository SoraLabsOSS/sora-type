import type { Font as FontkitFont } from "fontkit";

/** Unique codepoints a block of text actually needs, surrogate-pair safe. */
export function getUsedCodePoints(text: string): Set<number> {
  const codePoints = new Set<number>();
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      codePoints.add(codePoint);
    }
  }
  return codePoints;
}

/** Codepoints the text needs that this font doesn't have a glyph for at all. */
export function getUnsupportedCodePoints(
  used: Set<number>,
  font: FontkitFont
): number[] {
  const supported = new Set(font.characterSet);
  return [...used].filter((cp) => !supported.has(cp)).sort((a, b) => a - b);
}

/**
 * A ready `pyftsubset` (part of the `fonttools` Python package) command that
 * keeps only the given unicode ranges — `computeUnicodeRanges`'s
 * `U+XXXX-YYYY` output is already the exact syntax `--unicodes` expects, so
 * no extra formatting is needed here.
 */
export function buildPyftsubsetCommand(
  fileName: string,
  outputFileName: string,
  unicodeRanges: string[]
): string {
  return [
    `pyftsubset "${fileName}" \\`,
    `  --output-file="${outputFileName}" \\`,
    "  --flavor=woff2 \\",
    `  --unicodes=${unicodeRanges.join(",")}`,
  ].join("\n");
}

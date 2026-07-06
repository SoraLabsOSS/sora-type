/**
 * Compresses a font's supported codepoints into CSS `unicode-range` tokens
 * (e.g. `U+0000-00FF, U+0131`). fontkit exposes only a flat `characterSet`
 * list, so ranges are derived here.
 */
export function computeUnicodeRanges(codePoints: Iterable<number>): string[] {
  const sorted = [...codePoints].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start: number | null = null;
  let prev: number | null = null;

  for (const codePoint of sorted) {
    if (start === null || prev === null) {
      start = codePoint;
      prev = codePoint;
      continue;
    }
    if (codePoint === prev + 1) {
      prev = codePoint;
      continue;
    }
    ranges.push(formatRange(start, prev));
    start = codePoint;
    prev = codePoint;
  }
  if (start !== null && prev !== null) {
    ranges.push(formatRange(start, prev));
  }

  return ranges;
}

function formatRange(start: number, end: number): string {
  const startHex = start.toString(16).toUpperCase();
  if (start === end) {
    return `U+${startHex}`;
  }
  const endHex = end.toString(16).toUpperCase();
  return `U+${startHex}-${endHex}`;
}

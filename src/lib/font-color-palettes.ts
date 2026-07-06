import type { Font as FontkitFont } from "fontkit";

export interface ColorPalette {
  colors: string[];
  index: number;
}

const MIN_TOGGLEABLE_PALETTES = 2;

/** Whether this font has more than one color palette worth letting users pick between. */
export function hasColorPalettes(font: FontkitFont): boolean {
  return Boolean(
    font.COLR && font.CPAL && font.CPAL.numPalettes >= MIN_TOGGLEABLE_PALETTES
  );
}

/** Reads every CPAL color palette as CSS `rgba()` strings, in palette order. */
export function getColorPalettes(font: FontkitFont): ColorPalette[] {
  const cpal = font.CPAL;
  if (!(font.COLR && cpal)) {
    return [];
  }

  const palettes: ColorPalette[] = [];
  for (let index = 0; index < cpal.numPalettes; index++) {
    const start = cpal.colorRecordIndices[index];
    if (start === undefined) {
      continue;
    }
    const colors = cpal.colorRecords
      .slice(start, start + cpal.numPaletteEntries)
      .map(
        ({ red, green, blue, alpha }) =>
          `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(2)})`
      );
    palettes.push({ colors, index });
  }
  return palettes;
}

import type { Font as FontkitFont } from "fontkit";
import { resolveNameTableId } from "./opentype-feature-names";

export interface ColorPalette {
  colors: string[];
  index: number;
  name: string | null;
}

// CPAL spec sentinel meaning "this palette has no name".
const CPAL_NO_NAME_ID = 0xff_ff;

/**
 * fontkit only parses COLR/CPAL and sbix — `SVG ` and `CBDT`/`CBLC` color
 * tables exist in real fonts but aren't exposed as parsed structs, only as
 * raw entries in the sfnt table directory (presence only, no content).
 */
function getRawTableTags(
  font: FontkitFont
): Record<string, unknown> | undefined {
  return (
    font as FontkitFont & { directory?: { tables?: Record<string, unknown> } }
  ).directory?.tables;
}

/** Every color-glyph technology this font uses, in a stable display order. */
export function getColorFormats(font: FontkitFont): string[] {
  const tables = getRawTableTags(font);
  const formats: string[] = [];
  if (tables?.COLR) {
    formats.push("COLR");
  }
  if ((font as FontkitFont & { sbix?: unknown }).sbix) {
    formats.push("sbix");
  }
  if (tables?.["SVG "]) {
    formats.push("SVG");
  }
  if (tables?.CBDT) {
    formats.push("CBDT");
  }
  return formats;
}

export function isColorFont(font: FontkitFont): boolean {
  return getColorFormats(font).length > 0;
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
  const cpal = font.CPAL as
    | (FontkitFont["CPAL"] & { offsetPaletteLabelArray?: number[] })
    | undefined;
  if (!(font.COLR && cpal)) {
    return [];
  }

  // CPAL version 1 fonts can name each palette (e.g. "Light", "Grayscale")
  // via a nameID per palette, resolved through the `name` table.
  const paletteLabels =
    cpal.version === 1 ? cpal.offsetPaletteLabelArray : undefined;

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
    const nameID = paletteLabels?.[index];
    const name =
      nameID !== undefined && nameID !== CPAL_NO_NAME_ID
        ? resolveNameTableId(font, nameID)
        : null;
    palettes.push({ colors, index, name });
  }
  return palettes;
}

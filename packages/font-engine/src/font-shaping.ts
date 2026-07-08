import {
  Blob,
  Face,
  Feature,
  Font,
  Buffer as HBBuffer,
  shape,
} from "harfbuzzjs";

const NON_SPACING_MARK = /\p{Mn}/u;

function isMark(char: string): boolean {
  return NON_SPACING_MARK.test(char);
}

// Opt into positioning-relevant features; opt out of substitutions that
// would hide missing mark attachment (liga/rlig/calt/salt/rclt).
const SHAPING_FEATURES = [
  new Feature("kern", 1),
  new Feature("mark", 1),
  new Feature("mkmk", 1),
  new Feature("ccmp", 1),
  new Feature("abvm", 1),
  new Feature("blwm", 1),
  new Feature("dist", 1),
  new Feature("liga", 0),
  new Feature("rlig", 0),
  new Feature("rclt", 0),
  new Feature("calt", 0),
  new Feature("salt", 0),
];

export function createShapingFont(fontData: ArrayBuffer): Font {
  const blob = new Blob(fontData);
  const face = new Face(blob);
  return new Font(face);
}

/**
 * Shapes `input` (a base character plus its combining marks) and confirms
 * every mark glyph actually moved (got positioned by GPOS), rather than
 * just existing unattached at 0,0.
 */
export function checkMarkAttachment(font: Font, input: string): boolean {
  const composed = input.normalize("NFC");
  const chars = Array.from(composed.normalize("NFD"));

  // Nothing to attach for a lone character.
  if (composed.length === 1 && chars.length === 1) {
    return true;
  }

  if (!chars.some(isMark)) {
    return true;
  }

  const buffer = new HBBuffer();
  buffer.addText(chars.join(""));
  buffer.guessSegmentProperties();
  shape(font, buffer, SHAPING_FEATURES);
  const data = buffer.getGlyphInfosAndPositions();

  // A precomposed codepoint or a substitution collapsed the sequence to a
  // single output glyph — trust the font vendor did this intentionally.
  if (data.length === 1) {
    return true;
  }

  const nonMarkGlyphIds = new Set(
    chars
      .filter((c) => !isMark(c))
      .map((c) => font.nominalGlyph(c.codePointAt(0) as number))
  );
  const markGlyphIds = new Set(
    chars
      .filter(isMark)
      .map((c) => font.nominalGlyph(c.codePointAt(0) as number))
  );

  let missingFromFont = 0;
  let missingPositioning = 0;

  for (const glyph of data) {
    if (glyph.codepoint === 0) {
      missingFromFont++;
      continue;
    }
    if (nonMarkGlyphIds.has(glyph.codepoint)) {
      continue;
    }
    if (!markGlyphIds.has(glyph.codepoint)) {
      continue;
    }
    if ((glyph.xOffset ?? 0) === 0 && (glyph.yOffset ?? 0) === 0) {
      missingPositioning++;
    }
  }

  return missingFromFont === 0 && missingPositioning === 0;
}

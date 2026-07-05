"use client";

import { Grid } from "@astryxdesign/core/Grid";
import type { Font as FontkitFont } from "fontkit";
import { useMemo } from "react";

interface GlyphGridProps {
  cellMinWidth?: number;
  font: FontkitFont;
}

interface GlyphCell {
  char: string;
  codePoint: number;
  glyphName: string;
  pathData: string;
}

// Cap glyph count for v1 so a large CJK font doesn't render tens of
// thousands of SVGs at once; revisit with virtualization if needed.
const MAX_GLYPHS = 500;
const CONTROL_CHAR_CUTOFF = 0x20;

function buildGlyphCells(font: FontkitFont): GlyphCell[] {
  const codePoints = [...font.characterSet]
    .filter((cp) => cp > CONTROL_CHAR_CUTOFF)
    .sort((a, b) => a - b)
    .slice(0, MAX_GLYPHS);

  return codePoints.map((cp) => {
    const glyph = font.glyphForCodePoint(cp);
    return {
      codePoint: cp,
      char: String.fromCodePoint(cp),
      glyphName: glyph.name,
      pathData: glyph.path.toSVG(),
    };
  });
}

function toHex(codePoint: number): string {
  return codePoint.toString(16).padStart(4, "0");
}

export default function GlyphGrid({
  cellMinWidth = 100,
  font,
}: GlyphGridProps) {
  const cells = useMemo(() => buildGlyphCells(font), [font]);
  const { unitsPerEm, ascent } = font;
  const glyphPadding = cellMinWidth <= 72 ? "p-1.5" : "p-2.5";

  return (
    <Grid columns={{ minWidth: cellMinWidth, repeat: "fill" }} gap={0}>
      {cells.map((cell) => (
        <div
          aria-label={`Glyph ${cell.char}, Unicode U+${toHex(cell.codePoint)}`}
          className="group relative flex aspect-square flex-col border border-border"
          key={cell.codePoint}
          role="img"
        >
          <div className="relative min-h-0 flex-1">
            <svg
              aria-hidden="true"
              className={`h-full w-full ${glyphPadding} text-primary`}
              viewBox={`0 0 ${unitsPerEm} ${unitsPerEm}`}
            >
              <g transform={`translate(0, ${ascent}) scale(1, -1)`}>
                <path d={cell.pathData} fill="currentColor" />
              </g>
            </svg>
          </div>
          <span
            aria-hidden="true"
            className="shrink-0 px-1.5 pb-1 text-right font-mono text-[10px] text-secondary leading-none opacity-60"
          >
            {toHex(cell.codePoint)}
          </span>
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden flex-col items-center justify-center gap-0.5 bg-accent px-1 text-center text-on-accent text-xs group-hover:flex"
          >
            <span>Glyph: {cell.char}</span>
            <span>Unicode: {toHex(cell.codePoint)}</span>
          </div>
        </div>
      ))}
    </Grid>
  );
}

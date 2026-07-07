"use client";

import { Grid } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import type { Font as FontkitFont } from "fontkit";
import { useMemo } from "react";
import {
  classifyCodePoint,
  GLYPH_CATEGORY_ORDER,
  GLYPH_SUBCATEGORY_ORDER,
  type GlyphCategory,
} from "@/lib/glyph-category";

interface GlyphGridProps {
  cellMinWidth?: number;
  font: FontkitFont;
  groupByCategory?: boolean;
}

interface GlyphCell {
  char: string;
  codePoint: number;
  glyphName: string;
  pathData: string;
}

interface ScriptGroup {
  cells: GlyphCell[];
  script: string | null;
}

interface SubCategoryGroup {
  scriptGroups: ScriptGroup[];
  subCategory: string;
}

interface CategoryGroup {
  category: GlyphCategory;
  subGroups: SubCategoryGroup[];
}

// Cap glyph count for v1 so a large CJK font doesn't render tens of
// thousands of SVGs at once; revisit with virtualization if needed.
export const MAX_GLYPHS = 500;
const CONTROL_CHAR_CUTOFF = 0x20;
// Key for the "no specific script" bucket within a subcategory (e.g. digits,
// punctuation) — kept out of GlyphCell/script's public `null` so it can be a
// plain Map key.
const NO_SCRIPT_KEY = "";

/**
 * Number of distinct Unicode codepoints this font maps via cmap — the true
 * ceiling for what the grid below can ever display. Distinct from
 * `metadata.numGlyphs` (total glyf/CFF glyph count), which includes
 * unencoded glyphs (ligatures, alternates, composites) the grid never shows.
 */
export function getEncodedCodePointCount(font: FontkitFont): number {
  return [...font.characterSet].filter((cp) => cp > CONTROL_CHAR_CUTOFF).length;
}

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

function groupCells(cells: GlyphCell[]): CategoryGroup[] {
  const byCategory = new Map<
    GlyphCategory,
    Map<string, Map<string, GlyphCell[]>>
  >();

  for (const cell of cells) {
    const { category, subCategory, script } = classifyCodePoint(cell.codePoint);
    const scriptKey = script ?? NO_SCRIPT_KEY;

    let bySubCategory = byCategory.get(category);
    if (!bySubCategory) {
      bySubCategory = new Map();
      byCategory.set(category, bySubCategory);
    }

    let byScript = bySubCategory.get(subCategory);
    if (!byScript) {
      byScript = new Map();
      bySubCategory.set(subCategory, byScript);
    }

    const group = byScript.get(scriptKey);
    if (group) {
      group.push(cell);
    } else {
      byScript.set(scriptKey, [cell]);
    }
  }

  return GLYPH_CATEGORY_ORDER.filter((category) =>
    byCategory.has(category)
  ).map((category) => {
    const bySubCategory = byCategory.get(category) as Map<
      string,
      Map<string, GlyphCell[]>
    >;
    const subCategoryOrder = GLYPH_SUBCATEGORY_ORDER[category];
    const subCategories = [...bySubCategory.keys()].sort(
      (a, b) => subCategoryOrder.indexOf(a) - subCategoryOrder.indexOf(b)
    );

    return {
      category,
      subGroups: subCategories.map((subCategory) => {
        const byScript = bySubCategory.get(subCategory) as Map<
          string,
          GlyphCell[]
        >;
        const scriptKeys = [...byScript.keys()].sort((a, b) =>
          a.localeCompare(b)
        );

        return {
          subCategory,
          scriptGroups: scriptKeys.map((scriptKey) => ({
            script: scriptKey === NO_SCRIPT_KEY ? null : scriptKey,
            cells: byScript.get(scriptKey) as GlyphCell[],
          })),
        };
      }),
    };
  });
}

function toHex(codePoint: number): string {
  return codePoint.toString(16).padStart(4, "0");
}

// Padding around the reference box so glyphs that exactly fill it (e.g. an
// accented capital) don't render flush against the cell edge.
const VIEWBOX_PADDING_RATIO = 0.06;

interface GlyphViewBox {
  height: number;
  minX: number;
  minY: number;
  width: number;
}

/**
 * The nominal em box (x: [0, unitsPerEm], y: [descent, ascent]) is what lets
 * different fonts' glyphs compare at the same visual scale — it's the
 * "same point size" reference every font is conceptually drawn against.
 * Sizing the viewBox to it alone was the original bug: accented capitals,
 * overshoot on round letters, or fonts whose ascent+|descent| doesn't sum to
 * unitsPerEm routinely have ink outside that box, so tall or wide glyphs got
 * clipped by the SVG viewBox.
 *
 * Fix: start from the nominal em box, but grow (never shrink) each edge to
 * fit `font.bbox` — fontkit's real box enclosing every glyph — so nothing
 * ever clips. Growing only when a font actually overflows its own em box
 * keeps well-behaved fonts sized identically to before (and thus still
 * comparable to each other), instead of normalizing every font to its own
 * ink extent, which would make font A's glyphs look bigger than font B's
 * just because A's ink happens to fill less of its em square.
 */
function buildGlyphViewBox(font: FontkitFont): GlyphViewBox {
  const { unitsPerEm, ascent, descent, bbox } = font;
  const left = Math.min(0, bbox.minX);
  const right = Math.max(unitsPerEm, bbox.maxX);
  const bottom = Math.min(descent, bbox.minY);
  const top = Math.max(ascent, bbox.maxY);

  const boxWidth = right - left;
  const boxHeight = top - bottom;
  const padding = Math.max(boxWidth, boxHeight) * VIEWBOX_PADDING_RATIO;

  return {
    // Flipped to SVG's downward-y space (see the `scale(1, -1)` below): a
    // font-space point (x, y) renders at (x, -y), so the box's y-range
    // becomes [-top, -bottom].
    minX: left - padding,
    minY: -top - padding,
    width: boxWidth + padding * 2,
    height: boxHeight + padding * 2,
  };
}

function GlyphCellView({
  cell,
  glyphPadding,
  viewBox,
}: {
  cell: GlyphCell;
  glyphPadding: string;
  viewBox: GlyphViewBox;
}) {
  return (
    <div
      aria-label={`Glyph ${cell.char}, Unicode U+${toHex(cell.codePoint)}`}
      className="group relative flex aspect-square flex-col border border-border"
      role="img"
    >
      <div className="relative min-h-0 flex-1">
        <svg
          aria-hidden="true"
          className={`h-full w-full ${glyphPadding} text-primary`}
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        >
          <g transform="scale(1, -1)">
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
  );
}

function GlyphCellGrid({
  cells,
  cellMinWidth,
  glyphPadding,
  viewBox,
}: {
  cellMinWidth: number;
  cells: GlyphCell[];
  glyphPadding: string;
  viewBox: GlyphViewBox;
}) {
  return (
    <Grid columns={{ minWidth: cellMinWidth, repeat: "fill" }} gap={0}>
      {cells.map((cell) => (
        <GlyphCellView
          cell={cell}
          glyphPadding={glyphPadding}
          key={cell.codePoint}
          viewBox={viewBox}
        />
      ))}
    </Grid>
  );
}

export default function GlyphGrid({
  cellMinWidth = 100,
  font,
  groupByCategory = false,
}: GlyphGridProps) {
  const cells = useMemo(() => buildGlyphCells(font), [font]);
  const grouped = useMemo(
    () => (groupByCategory ? groupCells(cells) : null),
    [cells, groupByCategory]
  );
  const viewBox = useMemo(() => buildGlyphViewBox(font), [font]);
  const glyphPadding = cellMinWidth <= 72 ? "p-1.5" : "p-2.5";

  if (grouped) {
    return (
      <VStack gap={5}>
        {grouped.map((group) => (
          <VStack gap={3} key={group.category}>
            <Text className="font-sans" weight="semibold">
              {group.category}
            </Text>
            {group.subGroups.map((sub) => (
              <VStack gap={2} key={`${group.category}-${sub.subCategory}`}>
                <Text color="secondary" type="supporting">
                  {sub.subCategory}
                </Text>
                {sub.scriptGroups.map((scriptGroup) => (
                  <VStack
                    gap={1}
                    key={`${group.category}-${sub.subCategory}-${
                      scriptGroup.script ?? "none"
                    }`}
                  >
                    {scriptGroup.script && (
                      <Text
                        className="italic"
                        color="secondary"
                        type="supporting"
                      >
                        {scriptGroup.script} ({scriptGroup.cells.length})
                      </Text>
                    )}
                    <GlyphCellGrid
                      cellMinWidth={cellMinWidth}
                      cells={scriptGroup.cells}
                      glyphPadding={glyphPadding}
                      viewBox={viewBox}
                    />
                  </VStack>
                ))}
              </VStack>
            ))}
          </VStack>
        ))}
      </VStack>
    );
  }

  return (
    <GlyphCellGrid
      cellMinWidth={cellMinWidth}
      cells={cells}
      glyphPadding={glyphPadding}
      viewBox={viewBox}
    />
  );
}

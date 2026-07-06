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
const MAX_GLYPHS = 500;
const CONTROL_CHAR_CUTOFF = 0x20;
// Key for the "no specific script" bucket within a subcategory (e.g. digits,
// punctuation) — kept out of GlyphCell/script's public `null` so it can be a
// plain Map key.
const NO_SCRIPT_KEY = "";

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

function GlyphCellView({
  cell,
  glyphPadding,
  unitsPerEm,
  ascent,
}: {
  ascent: number;
  cell: GlyphCell;
  glyphPadding: string;
  unitsPerEm: number;
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
  );
}

function GlyphCellGrid({
  ascent,
  cells,
  cellMinWidth,
  glyphPadding,
  unitsPerEm,
}: {
  ascent: number;
  cellMinWidth: number;
  cells: GlyphCell[];
  glyphPadding: string;
  unitsPerEm: number;
}) {
  return (
    <Grid columns={{ minWidth: cellMinWidth, repeat: "fill" }} gap={0}>
      {cells.map((cell) => (
        <GlyphCellView
          ascent={ascent}
          cell={cell}
          glyphPadding={glyphPadding}
          key={cell.codePoint}
          unitsPerEm={unitsPerEm}
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
  const { unitsPerEm, ascent } = font;
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
                      ascent={ascent}
                      cellMinWidth={cellMinWidth}
                      cells={scriptGroup.cells}
                      glyphPadding={glyphPadding}
                      unitsPerEm={unitsPerEm}
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
      ascent={ascent}
      cellMinWidth={cellMinWidth}
      cells={cells}
      glyphPadding={glyphPadding}
      unitsPerEm={unitsPerEm}
    />
  );
}

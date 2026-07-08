"use client";

import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import type { Font as FontkitFont } from "fontkit";
import { useMemo, useState } from "react";

const REFERENCE_UPM = 1000;
const VIEWBOX_PADDING_RATIO = 0.1;
const MAX_OVERLAY_CHARS = 12;
const DEFAULT_OVERLAY_TEXT = "aRg";
const CELL_MIN_WIDTH = 160;

interface OverlayViewBox {
  height: number;
  minX: number;
  minY: number;
  width: number;
}

interface ReferenceBox {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

/**
 * The nominal em box (x: [0, unitsPerEm], y: [descent, ascent]), scaled to a
 * shared REFERENCE_UPM so fonts with different units-per-em overlay at the
 * same visual scale, grown (never shrunk) to fit the *displayed* glyphs'
 * real bounding boxes — same non-clipping principle as GlyphGrid's viewBox
 * (see glyph-grid.tsx), generalized across two fonts instead of one.
 *
 * Deliberately scoped to only the characters currently shown, not the
 * font's overall `font.bbox`: a font's global bbox is dragged around by
 * whatever glyph in the entire font has the most extreme ink (often an
 * unrelated symbol), which would shrink every displayed glyph down to fit
 * an outlier that isn't even on screen.
 */
function referenceBox(font: FontkitFont, chars: string[]): ReferenceBox {
  const scale = REFERENCE_UPM / font.unitsPerEm;
  const { unitsPerEm, ascent, descent } = font;
  let left = 0;
  let right = unitsPerEm;
  let bottom = descent;
  let top = ascent;

  for (const char of chars) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (!font.characterSet.includes(codePoint)) {
      continue;
    }
    const glyphBox = font.glyphForCodePoint(codePoint).bbox;
    left = Math.min(left, glyphBox.minX);
    right = Math.max(right, glyphBox.maxX);
    bottom = Math.min(bottom, glyphBox.minY);
    top = Math.max(top, glyphBox.maxY);
  }

  return {
    minX: left * scale,
    maxX: right * scale,
    minY: bottom * scale,
    maxY: top * scale,
  };
}

function buildOverlayViewBox(
  left: FontkitFont | null,
  right: FontkitFont | null,
  chars: string[]
): OverlayViewBox | null {
  const fonts = [left, right].filter((f): f is FontkitFont => f !== null);
  if (fonts.length === 0) {
    return null;
  }
  const boxes = fonts.map((font) => referenceBox(font, chars));

  const minX = Math.min(...boxes.map((b) => b.minX));
  const maxX = Math.max(...boxes.map((b) => b.maxX));
  const minY = Math.min(...boxes.map((b) => b.minY));
  const maxY = Math.max(...boxes.map((b) => b.maxY));
  const width = maxX - minX;
  const height = maxY - minY;
  const padding = Math.max(width, height) * VIEWBOX_PADDING_RATIO;

  return {
    // Flipped to SVG's downward-y space (each font's own `<g>` applies
    // `scale(s, -s)` below): a scaled point (x, y) renders at (x, -y).
    minX: minX - padding,
    minY: -maxY - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

function getPathData(font: FontkitFont, codePoint: number): string | null {
  if (!font.characterSet.includes(codePoint)) {
    return null;
  }
  return font.glyphForCodePoint(codePoint).path.toSVG();
}

function parseOverlayChars(input: string): string[] {
  const chars = [...new Set([...input].filter((c) => c.trim().length > 0))];
  return chars.slice(0, MAX_OVERLAY_CHARS);
}

interface FontMetricLine {
  label: string;
  value: number;
}

/**
 * x-height/cap-height only — baseline (0) is drawn once, shared by both
 * fonts, since it's the same y regardless of each font's own metrics.
 */
function fontMetricLines(font: FontkitFont): FontMetricLine[] {
  return [
    { label: "x-height", value: font.xHeight },
    { label: "Cap height", value: font.capHeight },
  ];
}

function MetricGuideLines({
  colorClass,
  font,
  scale,
  viewBox,
}: {
  colorClass: string;
  font: FontkitFont;
  scale: number;
  viewBox: OverlayViewBox;
}) {
  const x1 = viewBox.minX;
  const x2 = viewBox.minX + viewBox.width;
  return (
    <>
      {fontMetricLines(font).map((metric) => (
        <line
          className={colorClass}
          key={metric.label}
          strokeDasharray="4 3"
          strokeWidth={1}
          x1={x1}
          x2={x2}
          y1={-metric.value * scale}
          y2={-metric.value * scale}
        />
      ))}
    </>
  );
}

function OverlayCell({
  char,
  left,
  right,
  showMetricGuides,
  viewBox,
}: {
  char: string;
  left: FontkitFont | null;
  right: FontkitFont | null;
  showMetricGuides: boolean;
  viewBox: OverlayViewBox;
}) {
  const codePoint = char.codePointAt(0) ?? 0;
  const leftPath = left ? getPathData(left, codePoint) : null;
  const rightPath = right ? getPathData(right, codePoint) : null;
  const leftScale = left ? REFERENCE_UPM / left.unitsPerEm : 1;
  const rightScale = right ? REFERENCE_UPM / right.unitsPerEm : 1;

  const missing: string[] = [];
  if (left && !leftPath) {
    missing.push("first font");
  }
  if (right && !rightPath) {
    missing.push("second font");
  }

  return (
    <VStack gap={1}>
      <div className="relative flex aspect-square flex-col overflow-hidden rounded-md border border-border bg-body">
        <svg
          aria-label={`Glyph overlay for ${char}`}
          className="h-full w-full p-2"
          role="img"
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        >
          {showMetricGuides ? (
            <line
              className="stroke-border"
              strokeWidth={1}
              x1={viewBox.minX}
              x2={viewBox.minX + viewBox.width}
              y1={0}
              y2={0}
            />
          ) : null}
          {showMetricGuides && left ? (
            <MetricGuideLines
              colorClass="stroke-blue-vivid"
              font={left}
              scale={leftScale}
              viewBox={viewBox}
            />
          ) : null}
          {showMetricGuides && right ? (
            <MetricGuideLines
              colorClass="stroke-red-vivid"
              font={right}
              scale={rightScale}
              viewBox={viewBox}
            />
          ) : null}
          {leftPath ? (
            <g
              className="fill-blue-vivid opacity-60"
              transform={`scale(${leftScale}, ${-leftScale})`}
            >
              <path d={leftPath} />
            </g>
          ) : null}
          {rightPath ? (
            <g
              className="fill-red-vivid opacity-60"
              transform={`scale(${rightScale}, ${-rightScale})`}
            >
              <path d={rightPath} />
            </g>
          ) : null}
        </svg>
      </div>
      <Text
        className="text-center font-mono"
        color="secondary"
        type="supporting"
      >
        {char}
      </Text>
      {missing.length > 0 ? (
        <Text className="text-center" color="secondary" type="supporting">
          Missing in {missing.join(" and ")}
        </Text>
      ) : null}
    </VStack>
  );
}

export function CompareOverlay({
  left,
  right,
}: {
  left: FontkitFont | null;
  right: FontkitFont | null;
}) {
  const [input, setInput] = useState(DEFAULT_OVERLAY_TEXT);
  const [showMetricGuides, setShowMetricGuides] = useState(true);
  const chars = useMemo(() => parseOverlayChars(input), [input]);
  const viewBox = useMemo(
    () => buildOverlayViewBox(left, right, chars),
    [left, right, chars]
  );

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text color="secondary" type="supporting">
            Type up to {MAX_OVERLAY_CHARS} characters to overlay their outlines
            from both fonts.
          </Text>
          <input
            className="w-full rounded-md border border-border bg-body px-4 py-2 text-primary outline-none transition-colors focus-visible:border-accent"
            onChange={(event) => setInput(event.target.value)}
            placeholder={DEFAULT_OVERLAY_TEXT}
            spellCheck={false}
            value={input}
          />
          <HStack align="center" gap={4} wrap="wrap">
            <HStack align="center" gap={2}>
              <span className="inline-block h-3 w-3 rounded-full bg-blue-vivid" />
              <Text color="secondary" type="supporting">
                First font
              </Text>
            </HStack>
            <HStack align="center" gap={2}>
              <span className="inline-block h-3 w-3 rounded-full bg-red-vivid" />
              <Text color="secondary" type="supporting">
                Second font
              </Text>
            </HStack>
          </HStack>
          <Switch
            description="Dashed lines mark each font's own x-height and cap-height; the solid line is the shared baseline."
            label="Show metric guides"
            onChange={setShowMetricGuides}
            value={showMetricGuides}
          />
        </VStack>
      </Card>

      {chars.length === 0 || !viewBox ? (
        <Card padding={4}>
          <Text color="secondary" type="body">
            Type at least one character above to see its outline overlay.
          </Text>
        </Card>
      ) : (
        <Grid columns={{ minWidth: CELL_MIN_WIDTH, repeat: "fill" }} gap={4}>
          {chars.map((char) => (
            <OverlayCell
              char={char}
              key={char}
              left={left}
              right={right}
              showMetricGuides={showMetricGuides}
              viewBox={viewBox}
            />
          ))}
        </Grid>
      )}
    </VStack>
  );
}

"use client";

import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useState } from "react";
import type { FontSlotState } from "@/components/compare-view";
import GlyphGrid, {
  getEncodedCodePointCount,
  MAX_GLYPHS,
} from "@/components/glyph-grid";

const COMPARE_GRID_COLUMNS = { minWidth: 320, max: 2 } as const;
const GLYPH_CELL_MIN_WIDTH = 64;

function buildGlyphsCaption(encodedCodePointCount: number): string {
  if (encodedCodePointCount > MAX_GLYPHS) {
    return `Showing the first ${MAX_GLYPHS} of ${encodedCodePointCount.toLocaleString()} characters.`;
  }
  return "Showing every character this font maps.";
}

function CharactersColumn({
  groupByCategory,
  label,
  state,
}: {
  groupByCategory: boolean;
  label: string;
  state: FontSlotState;
}) {
  if (!state.font) {
    return (
      <Card height="100%" minHeight={240} padding={4}>
        <Text color="secondary" type="supporting">
          {label} font not loaded yet.
        </Text>
      </Card>
    );
  }

  return (
    <Card height="100%" padding={4}>
      <VStack gap={3}>
        <Heading className="font-sans" level={3}>
          {state.meta?.fullName}
        </Heading>
        <Text color="secondary" type="supporting">
          {buildGlyphsCaption(getEncodedCodePointCount(state.font))}
        </Text>
        <GlyphGrid
          cellMinWidth={GLYPH_CELL_MIN_WIDTH}
          font={state.font}
          groupByCategory={groupByCategory}
        />
      </VStack>
    </Card>
  );
}

export function CompareCharacters({
  left,
  right,
}: {
  left: FontSlotState;
  right: FontSlotState;
}) {
  const [groupByCategory, setGroupByCategory] = useState(false);

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <Switch
          label="Group by category"
          onChange={setGroupByCategory}
          value={groupByCategory}
        />
      </Card>
      <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
        <GridSpan columns={1}>
          <CharactersColumn
            groupByCategory={groupByCategory}
            label="First"
            state={left}
          />
        </GridSpan>
        <GridSpan columns={1}>
          <CharactersColumn
            groupByCategory={groupByCategory}
            label="Second"
            state={right}
          />
        </GridSpan>
      </Grid>
    </VStack>
  );
}

"use client";

import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FontSlotState } from "@/components/compare-view";
import GlyphGrid, {
  getEncodedCodePointCount,
  MAX_GLYPHS,
} from "@/components/glyph-grid";

const COMPARE_GRID_COLUMNS = { minWidth: 320, max: 2 } as const;
const GLYPH_CELL_MIN_WIDTH = 64;

function CharactersColumn({
  groupByCategory,
  slot,
  state,
}: {
  groupByCategory: boolean;
  slot: "left" | "right";
  state: FontSlotState;
}) {
  const t = useTranslations("compare");

  if (!state.font) {
    return (
      <Card height="100%" minHeight={240} padding={4}>
        <Text color="secondary" type="supporting">
          {slot === "left" ? t("notLoaded.first") : t("notLoaded.second")}
        </Text>
      </Card>
    );
  }

  const encodedCodePointCount = getEncodedCodePointCount(state.font);
  const caption =
    encodedCodePointCount > MAX_GLYPHS
      ? t("characters.captionLimited", {
          max: MAX_GLYPHS,
          total: encodedCodePointCount,
        })
      : t("characters.captionAll");

  return (
    <Card height="100%" padding={4}>
      <VStack gap={3}>
        <Heading className="font-sans" level={3}>
          {state.meta?.fullName}
        </Heading>
        <Text color="secondary" type="supporting">
          {caption}
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
  const t = useTranslations("compare");
  const [groupByCategory, setGroupByCategory] = useState(false);

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <Switch
          label={t("characters.groupByCategory")}
          onChange={setGroupByCategory}
          value={groupByCategory}
        />
      </Card>
      <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
        <GridSpan columns={1}>
          <CharactersColumn
            groupByCategory={groupByCategory}
            slot="left"
            state={left}
          />
        </GridSpan>
        <GridSpan columns={1}>
          <CharactersColumn
            groupByCategory={groupByCategory}
            slot="right"
            state={right}
          />
        </GridSpan>
      </Grid>
    </VStack>
  );
}

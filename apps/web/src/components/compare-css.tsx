"use client";

import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useTranslations } from "next-intl";
import type { CompareFontSlot } from "@/components/compare-view";
import { FontInspectorStylesheet } from "@/components/font-inspector-stylesheet";

const COMPARE_GRID_COLUMNS = { minWidth: 360, max: 2 } as const;

function CssColumn({
  slot,
  slotKey,
}: {
  slot: CompareFontSlot | null;
  slotKey: "left" | "right";
}) {
  const t = useTranslations("compare");

  if (!slot) {
    return (
      <Card height="100%" minHeight={240} padding={4}>
        <Text color="secondary" type="supporting">
          {slotKey === "left" ? t("notLoaded.first") : t("notLoaded.second")}
        </Text>
      </Card>
    );
  }

  const label =
    slotKey === "left" ? t("fontInput.first") : t("fontInput.second");

  return (
    <VStack gap={2}>
      <Text color="secondary" type="supporting">
        {label} — {slot.metadata.familyName}
      </Text>
      <FontInspectorStylesheet
        fileName={slot.fileName}
        font={slot.font}
        metadata={slot.metadata}
      />
    </VStack>
  );
}

export function CompareCss({
  left,
  right,
}: {
  left: CompareFontSlot | null;
  right: CompareFontSlot | null;
}) {
  return (
    <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
      <GridSpan columns={1}>
        <CssColumn slot={left} slotKey="left" />
      </GridSpan>
      <GridSpan columns={1}>
        <CssColumn slot={right} slotKey="right" />
      </GridSpan>
    </Grid>
  );
}

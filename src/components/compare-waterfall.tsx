"use client";

import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { FontSlotState } from "@/components/compare-view";

const COMPARE_GRID_COLUMNS = { minWidth: 320, max: 2 } as const;
const SIZE_STEPS = [12, 16, 20, 24, 32, 40, 56, 72, 96];
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

function WaterfallColumn({
  label,
  state,
  text,
}: {
  label: string;
  state: FontSlotState;
  text: string;
}) {
  if (!(state.font && state.cssFontFamily)) {
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
        <VStack gap={3}>
          {SIZE_STEPS.map((size, index) => (
            <VStack gap={1} key={size}>
              {index > 0 ? <Divider variant="subtle" /> : null}
              <Text color="secondary" type="supporting">
                {size}px
              </Text>
              <Text
                as="p"
                style={{
                  fontFamily: state.cssFontFamily ?? undefined,
                  fontSize: size,
                  lineHeight: "normal",
                }}
              >
                {text}
              </Text>
            </VStack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}

export function CompareWaterfall({
  left,
  right,
  text,
}: {
  left: FontSlotState;
  right: FontSlotState;
  text?: string;
}) {
  const resolvedText = text ?? SAMPLE_TEXT;
  return (
    <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
      <GridSpan columns={1}>
        <WaterfallColumn label="First" state={left} text={resolvedText} />
      </GridSpan>
      <GridSpan columns={1}>
        <WaterfallColumn label="Second" state={right} text={resolvedText} />
      </GridSpan>
    </Grid>
  );
}

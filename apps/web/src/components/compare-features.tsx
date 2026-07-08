"use client";

import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { isToggleableFeature } from "@sora-type/font-engine/opentype-feature-classification";
import {
  getFeatureUiName,
  getOpenTypeFeatureName,
} from "@sora-type/font-engine/opentype-feature-names";
import { createFeatureSampleFinder } from "@sora-type/font-engine/opentype-feature-samples";
import { useMemo } from "react";
import type { CompareFontSlot } from "@/components/compare-view";

const COMPARE_GRID_COLUMNS = { minWidth: 320, max: 2 } as const;
const DEMO_FONT_SIZE = 20;
const DEFAULT_DEMO_TEXT =
  "The quick brown fox jumps over the lazy dog. 0123456789";

interface FeatureRow extends Record<string, unknown> {
  id: string;
  inLeft: boolean;
  inRight: boolean;
  isRequired: boolean;
  name: string;
  tag: string;
}

function buildFeatureRows(
  left: CompareFontSlot | null,
  right: CompareFontSlot | null
): FeatureRow[] {
  const leftTags = new Set(left?.metadata.openTypeFeatures ?? []);
  const rightTags = new Set(right?.metadata.openTypeFeatures ?? []);
  const tags = [...new Set([...leftTags, ...rightTags])].toSorted();

  return tags.map((tag) => {
    const inLeft = leftTags.has(tag);
    const inRight = rightTags.has(tag);
    // Prefer the font that actually declares the tag for the UI name lookup
    // (stylistic sets etc. can carry a font-authored name via the `name`
    // table's feature-name records).
    const font = inLeft ? left?.font : right?.font;
    const name = font
      ? (getFeatureUiName(font, tag) ?? getOpenTypeFeatureName(tag))
      : getOpenTypeFeatureName(tag);

    return {
      id: tag,
      tag,
      name,
      isRequired: !isToggleableFeature(tag),
      inLeft,
      inRight,
    };
  });
}

function PresenceCell({ present }: { present: boolean }) {
  return (
    <HStack align="center" gap={2}>
      <StatusDot
        label={present ? "Present" : "Not present"}
        variant={present ? "success" : "neutral"}
      />
      <Text type="supporting">{present ? "Present" : "Not present"}</Text>
    </HStack>
  );
}

function FeatureTable({ rows }: { rows: FeatureRow[] }) {
  return (
    <Table<FeatureRow>
      columns={[
        {
          key: "tag",
          header: "Feature",
          width: proportional(2, { minWidth: 180 }),
          renderCell: (row) => (
            <Text type="body">
              <span className="font-mono text-secondary text-xs">
                {row.tag}
              </span>{" "}
              {row.name}
            </Text>
          ),
        },
        {
          key: "isRequired",
          header: "Type",
          width: proportional(1, { minWidth: 100 }),
          renderCell: (row) => (
            <Token
              color={row.isRequired ? "gray" : "blue"}
              label={row.isRequired ? "Required" : "Optional"}
            />
          ),
        },
        {
          key: "inLeft",
          header: "First font",
          width: proportional(1, { minWidth: 130 }),
          renderCell: (row) => <PresenceCell present={row.inLeft} />,
        },
        {
          key: "inRight",
          header: "Second font",
          width: proportional(1, { minWidth: 130 }),
          renderCell: (row) => <PresenceCell present={row.inRight} />,
        },
      ]}
      data={rows}
      density="balanced"
      dividers="rows"
      idKey="id"
      textOverflow="wrap"
      verticalAlign="top"
    />
  );
}

function FeatureDemoColumn({
  label,
  slot,
  tag,
}: {
  label: string;
  slot: CompareFontSlot;
  tag: string;
}) {
  const sample = useMemo(() => {
    const findSample = createFeatureSampleFinder(slot.font);
    return findSample(tag) ?? DEFAULT_DEMO_TEXT;
  }, [slot.font, tag]);

  return (
    <VStack gap={1}>
      <Text color="secondary" type="supporting">
        {label}
      </Text>
      <div
        className="rounded-md border border-border bg-body px-3 py-2 text-primary"
        style={{
          fontFamily: slot.cssFontFamily ?? "inherit",
          fontFeatureSettings: `"${tag}" 1`,
          fontSize: DEMO_FONT_SIZE,
        }}
      >
        {sample}
      </div>
    </VStack>
  );
}

function SharedFeatureDemo({
  left,
  name,
  right,
  tag,
}: {
  left: CompareFontSlot;
  name: string;
  right: CompareFontSlot;
  tag: string;
}) {
  return (
    <VStack gap={2}>
      <Text type="body">
        <span className="font-mono text-secondary text-xs">{tag}</span> {name}
      </Text>
      <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
        <GridSpan columns={1}>
          <FeatureDemoColumn label="First font" slot={left} tag={tag} />
        </GridSpan>
        <GridSpan columns={1}>
          <FeatureDemoColumn label="Second font" slot={right} tag={tag} />
        </GridSpan>
      </Grid>
    </VStack>
  );
}

export function CompareFeatures({
  left,
  right,
}: {
  left: CompareFontSlot | null;
  right: CompareFontSlot | null;
}) {
  const rows = useMemo(() => buildFeatureRows(left, right), [left, right]);

  const sharedToggleable = useMemo(
    () => rows.filter((row) => !row.isRequired && row.inLeft && row.inRight),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <Card padding={4}>
        <Text color="secondary" type="body">
          Neither font defines any OpenType layout features.
        </Text>
      </Card>
    );
  }

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            Layout features ({rows.length})
          </Heading>
          <FeatureTable rows={rows} />
        </VStack>
      </Card>

      {left && right && sharedToggleable.length > 0 ? (
        <Card padding={4}>
          <VStack gap={4}>
            <Heading className="font-sans" level={3}>
              Shared feature preview
            </Heading>
            <Text color="secondary" type="supporting">
              Both fonts support these — shown with the feature turned on.
            </Text>
            {sharedToggleable.map((row) => (
              <SharedFeatureDemo
                key={row.tag}
                left={left}
                name={row.name}
                right={right}
                tag={row.tag}
              />
            ))}
          </VStack>
        </Card>
      ) : null}
    </VStack>
  );
}

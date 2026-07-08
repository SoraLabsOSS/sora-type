"use client";

import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { useMemo } from "react";
import type { CompareFontSlot } from "@/components/compare-view";
import {
  buildPairingInsights,
  type PairingMagnitude,
} from "@/lib/font-pairing";

const HEADING_SIZE = 32;
const BODY_SIZE = 16;
const PREVIEW_TEXT = "Type with confidence";
const BODY_TEXT =
  "The two fonts above are set at a typical heading and body size so you can see how the difference actually reads.";

const MAGNITUDE_LABEL: Record<PairingMagnitude, string> = {
  matched: "Matched",
  moderate: "Moderate",
  distinct: "Distinct",
};

const MAGNITUDE_COLOR: Record<PairingMagnitude, "default" | "gray" | "blue"> = {
  matched: "gray",
  moderate: "blue",
  distinct: "default",
};

interface InsightRow extends Record<string, unknown> {
  id: string;
  label: string;
  leftValue: string;
  magnitude: PairingMagnitude;
  note: string;
  rightValue: string;
}

function InsightTable({ rows }: { rows: InsightRow[] }) {
  return (
    <Table<InsightRow>
      columns={[
        {
          key: "label",
          header: "Axis",
          width: proportional(1, { minWidth: 130 }),
          renderCell: (row) => <Text type="body">{row.label}</Text>,
        },
        {
          key: "leftValue",
          header: "First font",
          width: proportional(1, { minWidth: 110 }),
          renderCell: (row) => (
            <Text className="tabular-nums" type="body">
              {row.leftValue}
            </Text>
          ),
        },
        {
          key: "rightValue",
          header: "Second font",
          width: proportional(1, { minWidth: 110 }),
          renderCell: (row) => (
            <Text className="tabular-nums" type="body">
              {row.rightValue}
            </Text>
          ),
        },
        {
          key: "magnitude",
          header: "Difference",
          width: proportional(2, { minWidth: 220 }),
          renderCell: (row) => (
            <VStack gap={1}>
              <Token
                color={MAGNITUDE_COLOR[row.magnitude]}
                label={MAGNITUDE_LABEL[row.magnitude]}
              />
              <Text color="secondary" type="supporting">
                {row.note}
              </Text>
            </VStack>
          ),
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

export function ComparePairing({
  left,
  right,
}: {
  left: CompareFontSlot | null;
  right: CompareFontSlot | null;
}) {
  const rows = useMemo<InsightRow[]>(
    () =>
      left && right
        ? buildPairingInsights(left.metadata, right.metadata).map(
            (insight) => ({ ...insight })
          )
        : [],
    [left, right]
  );

  if (!(left && right)) {
    return (
      <Card padding={4}>
        <Text color="secondary" type="body">
          Load both fonts to see how their proportions compare.
        </Text>
      </Card>
    );
  }

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <Text color="secondary" type="supporting">
          This compares geometric proportions only — it can't judge taste. A
          "Distinct" result may be exactly the contrast you're going for.
        </Text>
      </Card>

      <Card padding={4}>
        <VStack gap={2}>
          <Text
            style={{
              fontFamily: left.cssFontFamily ?? "inherit",
              fontSize: HEADING_SIZE,
            }}
            type="body"
          >
            {PREVIEW_TEXT}
          </Text>
          <Text
            color="secondary"
            style={{
              fontFamily: right.cssFontFamily ?? "inherit",
              fontSize: BODY_SIZE,
            }}
            type="body"
          >
            {BODY_TEXT}
          </Text>
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={3}>
          <HStack align="center" gap={2} justify="between">
            <Heading className="font-sans" level={3}>
              Pairing
            </Heading>
          </HStack>
          <InsightTable rows={rows} />
        </VStack>
      </Card>
    </VStack>
  );
}

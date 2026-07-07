"use client";

import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useMemo, useState } from "react";
import { CompareLanguageTable } from "@/components/compare-language-table";
import type { ComparisonMatrix } from "@/lib/font-compare";
import {
  buildFontDetailFields,
  type FontMetadata,
  type FontVariationAxisSummary,
} from "@/lib/font-metadata";

const MISSING_VALUE = "—";

interface DataRow extends Record<string, unknown> {
  differs: boolean;
  id: string;
  label: string;
  leftValue: string;
  rightValue: string;
}

function mergeDetailRows(
  left: FontMetadata | null,
  right: FontMetadata | null
): DataRow[] {
  const leftFields = left ? buildFontDetailFields(left) : [];
  const rightFields = right ? buildFontDetailFields(right) : [];
  const rightByLabel = new Map(rightFields.map((f) => [f.label, f.value]));
  const seen = new Set<string>();
  const rows: DataRow[] = [];

  for (const field of leftFields) {
    const rightValue = rightByLabel.get(field.label) ?? MISSING_VALUE;
    rows.push({
      id: field.label,
      label: field.label,
      leftValue: field.value,
      rightValue,
      differs: rightValue !== field.value,
    });
    seen.add(field.label);
  }
  for (const field of rightFields) {
    if (!seen.has(field.label)) {
      rows.push({
        id: field.label,
        label: field.label,
        leftValue: MISSING_VALUE,
        rightValue: field.value,
        differs: true,
      });
    }
  }
  return rows;
}

function formatAxis(axis: FontVariationAxisSummary | undefined): string {
  if (!axis) {
    return MISSING_VALUE;
  }
  return `${axis.min}–${axis.default}–${axis.max}`;
}

function buildAxisRows(
  left: FontMetadata | null,
  right: FontMetadata | null
): DataRow[] {
  const leftAxes = new Map(
    (left?.variationAxes ?? []).map((axis) => [axis.tag, axis])
  );
  const rightAxes = new Map(
    (right?.variationAxes ?? []).map((axis) => [axis.tag, axis])
  );
  const tags = [
    ...new Set([...leftAxes.keys(), ...rightAxes.keys()]),
  ].toSorted();

  return tags.map((tag) => {
    const leftAxis = leftAxes.get(tag);
    const rightAxis = rightAxes.get(tag);
    return {
      id: `axis-${tag}`,
      label: `${leftAxis?.name ?? rightAxis?.name ?? tag} (${tag})`,
      leftValue: formatAxis(leftAxis),
      rightValue: formatAxis(rightAxis),
      differs: formatAxis(leftAxis) !== formatAxis(rightAxis),
    };
  });
}

function buildTableRows(
  left: FontMetadata | null,
  right: FontMetadata | null
): DataRow[] {
  const leftTables = new Set(left?.tables ?? []);
  const rightTables = new Set(right?.tables ?? []);
  const tags = [...new Set([...leftTables, ...rightTables])].toSorted();

  return tags.map((tag) => {
    const inLeft = leftTables.has(tag);
    const inRight = rightTables.has(tag);
    return {
      id: `table-${tag}`,
      label: tag,
      leftValue: inLeft ? "Present" : MISSING_VALUE,
      rightValue: inRight ? "Present" : MISSING_VALUE,
      differs: inLeft !== inRight,
    };
  });
}

function DataTable({
  highlightDifferences,
  rows,
}: {
  highlightDifferences: boolean;
  rows: DataRow[];
}) {
  return (
    <Table<DataRow>
      columns={[
        {
          key: "label",
          header: "Field",
          width: proportional(2, { minWidth: 140 }),
          renderCell: (row) => <Text type="body">{row.label}</Text>,
        },
        {
          key: "leftValue",
          header: "First font",
          width: proportional(2, { minWidth: 160 }),
          renderCell: (row) => (
            <Text
              className="wrap-break-word"
              type="body"
              weight={highlightDifferences && row.differs ? "bold" : undefined}
            >
              {row.leftValue}
            </Text>
          ),
        },
        {
          key: "rightValue",
          header: "Second font",
          width: proportional(2, { minWidth: 160 }),
          renderCell: (row) => (
            <Text
              className="wrap-break-word"
              type="body"
              weight={highlightDifferences && row.differs ? "bold" : undefined}
            >
              {row.rightValue}
            </Text>
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

export function CompareData({
  leftMeta,
  matrix,
  rightMeta,
}: {
  leftMeta: FontMetadata | null;
  matrix: ComparisonMatrix;
  rightMeta: FontMetadata | null;
}) {
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  const detailRows = useMemo(
    () => mergeDetailRows(leftMeta, rightMeta),
    [leftMeta, rightMeta]
  );
  const axisRows = useMemo(
    () => buildAxisRows(leftMeta, rightMeta),
    [leftMeta, rightMeta]
  );
  const tableRows = useMemo(
    () => buildTableRows(leftMeta, rightMeta),
    [leftMeta, rightMeta]
  );

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={2}>
          <Switch
            label="Highlight differences"
            onChange={setHighlightDifferences}
            value={highlightDifferences}
          />
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            Font details
          </Heading>
          <DataTable
            highlightDifferences={highlightDifferences}
            rows={detailRows}
          />
        </VStack>
      </Card>

      {axisRows.length > 0 ? (
        <Card padding={4}>
          <VStack gap={3}>
            <Heading className="font-sans" level={3}>
              Variable axes
            </Heading>
            <Text color="secondary" type="supporting">
              Shown as min–default–max.
            </Text>
            <DataTable
              highlightDifferences={highlightDifferences}
              rows={axisRows}
            />
          </VStack>
        </Card>
      ) : null}

      <Card padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            Tables ({tableRows.length})
          </Heading>
          <DataTable
            highlightDifferences={highlightDifferences}
            rows={tableRows}
          />
        </VStack>
      </Card>

      <Divider variant="subtle" />

      <VStack gap={3}>
        <Heading className="font-sans" level={3}>
          Language support
        </Heading>
        <CompareLanguageTable matrix={matrix} />
      </VStack>
    </VStack>
  );
}

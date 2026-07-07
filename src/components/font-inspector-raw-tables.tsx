"use client";

import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { VStack } from "@astryxdesign/core/Layout";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { Font as FontkitFont } from "fontkit";
import { useMemo } from "react";
import {
  buildRawTableSections,
  type RawDisplayRow,
  type RawTableSection as RawTableSectionData,
} from "@/lib/font-raw-tables";

interface FontInspectorRawTablesProps {
  font: FontkitFont;
}

interface RawFieldRow extends Record<string, unknown> {
  id: string;
  key: string;
  value: string;
}

function toFieldRows(rows: RawDisplayRow[]): RawFieldRow[] {
  return rows.map((row, index) => ({
    ...row,
    id: `${row.key}-${index}`,
  }));
}

function RawTableFields({ rows }: { rows: RawDisplayRow[] }) {
  return (
    <Table<RawFieldRow>
      columns={[
        {
          key: "key",
          header: "Field",
          width: proportional(2, { minWidth: 120 }),
          renderCell: (row) => (
            <Text className="font-mono" color="secondary" type="supporting">
              {row.key}
            </Text>
          ),
        },
        {
          key: "value",
          header: "Value",
          width: proportional(3, { minWidth: 160 }),
          renderCell: (row) => (
            <Text className="wrap-break-word font-mono" type="body">
              {row.value}
            </Text>
          ),
        },
      ]}
      data={toFieldRows(rows)}
      density="balanced"
      dividers="rows"
      idKey="id"
      textOverflow="wrap"
      verticalAlign="top"
    />
  );
}

function RawTableSectionBlock({
  index,
  section,
}: {
  index: number;
  section: RawTableSectionData;
}) {
  const fieldLabel = section.rows.length === 1 ? "field" : "fields";

  return (
    <VStack gap={2}>
      {index > 0 ? <Divider variant="subtle" /> : null}
      <Collapsible
        defaultIsOpen={section.tag === "name"}
        trigger={
          <Text className="py-0.5" type="body">
            <Text as="span" className="font-mono" weight="bold">
              {section.tag}
            </Text>
            {" · "}
            <Text as="span" className="tabular-nums">
              {section.byteLength.toLocaleString()} bytes
            </Text>
            {" · "}
            <Text as="span" color="secondary">
              {section.parsed ? section.description : "Not parsed"}
            </Text>
            {section.rows.length > 0 ? (
              <Text as="span" color="secondary">
                {" "}
                ({section.rows.length} {fieldLabel})
              </Text>
            ) : null}
          </Text>
        }
      >
        <VStack className="pt-3" gap={2}>
          {section.rows.length > 0 ? (
            <RawTableFields rows={section.rows} />
          ) : (
            <Text color="secondary" type="supporting">
              No decoded fields for this table.
            </Text>
          )}
        </VStack>
      </Collapsible>
    </VStack>
  );
}

export function FontInspectorRawTables({ font }: FontInspectorRawTablesProps) {
  const sections = useMemo(() => buildRawTableSections(font), [font]);

  if (sections.length === 0) {
    return (
      <Text color="secondary" type="supporting">
        No raw tables found in this font.
      </Text>
    );
  }

  const totalBytes = sections.reduce(
    (sum, section) => sum + section.byteLength,
    0
  );

  return (
    <Card className="bg-surface" padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Heading className="font-sans" level={3}>
            Raw tables
          </Heading>
          <Text color="secondary" type="supporting">
            {sections.length} tables · {totalBytes.toLocaleString()} bytes
            total. Expand a table to inspect its decoded fields.
          </Text>
        </VStack>

        <VStack gap={3}>
          {sections.map((section, index) => (
            <RawTableSectionBlock
              index={index}
              key={section.tag}
              section={section}
            />
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}

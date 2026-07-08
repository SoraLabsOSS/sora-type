"use client";

import { HStack, VStack } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Switch } from "@astryxdesign/core/Switch";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import type { ComparisonMatrix } from "@sora-type/font-engine/font-compare";
import type { LanguageSupportResult } from "@sora-type/font-engine/font-language-detection";
import { useMemo, useState } from "react";

type SupportLevel = LanguageSupportResult["support"];

const SUPPORT_LABELS: Record<SupportLevel, string> = {
  full: "Full",
  decomposed: "Decomposed",
  "positioning-failed": "Positioning issue",
  none: "Not supported",
};

const SUPPORT_VARIANTS: Record<
  SupportLevel,
  "success" | "warning" | "error" | "neutral"
> = {
  full: "success",
  decomposed: "warning",
  "positioning-failed": "error",
  none: "neutral",
};

interface LanguageRow extends Record<string, unknown> {
  id: string;
  leftSupport: SupportLevel;
  name: string;
  rightSupport: SupportLevel;
  script: string;
}

function SupportCell({ support }: { support: SupportLevel }) {
  return (
    <HStack align="center" gap={2}>
      <StatusDot
        label={SUPPORT_LABELS[support]}
        variant={SUPPORT_VARIANTS[support]}
      />
      <Text type="supporting">{SUPPORT_LABELS[support]}</Text>
    </HStack>
  );
}

export function CompareLanguageTable({ matrix }: { matrix: ComparisonMatrix }) {
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const rows = useMemo<LanguageRow[]>(() => {
    const leftId = matrix.fonts[0]?.id;
    const rightId = matrix.fonts[1]?.id;
    return matrix.languages.map((row) => ({
      id: row.key,
      name: row.name,
      script: row.script,
      leftSupport: matrix.cells[leftId ?? ""]?.[row.key]?.support ?? "none",
      rightSupport: matrix.cells[rightId ?? ""]?.[row.key]?.support ?? "none",
    }));
  }, [matrix]);

  const filteredRows = useMemo(
    () =>
      differencesOnly
        ? rows.filter((row) => row.leftSupport !== row.rightSupport)
        : rows,
    [rows, differencesOnly]
  );

  return (
    <VStack gap={3}>
      <Switch
        label="Show differences only"
        onChange={setDifferencesOnly}
        value={differencesOnly}
      />
      {filteredRows.length === 0 ? (
        <Text color="secondary" type="supporting">
          No language differences between these fonts.
        </Text>
      ) : (
        <Table<LanguageRow>
          columns={[
            {
              key: "name",
              header: "Language",
              width: proportional(2, { minWidth: 160 }),
              renderCell: (row) => (
                <Text type="body">
                  {row.name}{" "}
                  <Text as="span" color="secondary">
                    ({row.script})
                  </Text>
                </Text>
              ),
            },
            {
              key: "leftSupport",
              header: "First font",
              width: proportional(1, { minWidth: 140 }),
              renderCell: (row) => <SupportCell support={row.leftSupport} />,
            },
            {
              key: "rightSupport",
              header: "Second font",
              width: proportional(1, { minWidth: 140 }),
              renderCell: (row) => <SupportCell support={row.rightSupport} />,
            },
          ]}
          data={filteredRows}
          density="balanced"
          dividers="rows"
          idKey="id"
          textOverflow="wrap"
          verticalAlign="top"
        />
      )}
    </VStack>
  );
}

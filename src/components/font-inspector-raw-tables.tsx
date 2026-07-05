"use client";

import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import type { Font as FontkitFont } from "fontkit";
import { useMemo } from "react";
import {
  buildRawDisplayColumns,
  type RawDisplayRow,
} from "@/lib/font-raw-tables";

interface FontInspectorRawTablesProps {
  font: FontkitFont;
}

function RawDisplayRowItem({ row }: { row: RawDisplayRow }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-border border-b py-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-x-4 sm:py-2.5">
      <Text
        className="font-mono text-sm leading-snug sm:text-base"
        color="secondary"
        type="body"
      >
        {row.key}
      </Text>
      <Text
        className="wrap-break-word font-mono text-sm leading-relaxed sm:text-base"
        type="body"
      >
        {row.value}
      </Text>
    </div>
  );
}

function RawColumn({
  emptyLabel,
  rows,
}: {
  emptyLabel: string;
  rows: RawDisplayRow[];
}) {
  if (rows.length === 0) {
    return (
      <Text color="secondary" type="supporting">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <VStack gap={0}>
      {rows.map((row) => (
        <RawDisplayRowItem key={row.key} row={row} />
      ))}
    </VStack>
  );
}

export function FontInspectorRawTables({ font }: FontInspectorRawTablesProps) {
  const { left, right } = useMemo(() => buildRawDisplayColumns(font), [font]);

  if (left.length === 0 && right.length === 0) {
    return (
      <Text color="secondary" type="supporting">
        No raw tables found in this font.
      </Text>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:h-full lg:grid-cols-2 lg:gap-8 lg:divide-x lg:divide-border lg:overflow-hidden">
      <div className="scrollbar-hidden min-h-0 lg:overflow-y-auto lg:pr-4">
        <RawColumn emptyLabel="No naming records." rows={left} />
      </div>
      <div className="scrollbar-hidden min-h-0 lg:overflow-y-auto lg:pl-4">
        <RawColumn emptyLabel="No table metrics." rows={right} />
      </div>
    </div>
  );
}

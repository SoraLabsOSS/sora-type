"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  DetailRow,
  summarizeScripts,
} from "@/components/font-inspector-fields";
import type { LanguageSupportResult } from "@/lib/font-language-detection";
import {
  buildFontSummaryFields,
  type FontMetadata,
  formatFileSize,
} from "@/lib/font-metadata";

interface LoadedFontSummary {
  fileName: string;
  fileSizeBytes: number;
  fullName: string;
  numGlyphs: number;
}

interface FontInspectorSidebarProps {
  detected: (LanguageSupportResult & { rowKey: string })[];
  fontMetadata: FontMetadata | null;
  isExporting: boolean;
  isPlaceholder: boolean;
  loadedFont: LoadedFontSummary | null;
  onExportPdf: () => void;
}

export function FontInspectorSidebar({
  detected,
  fontMetadata,
  isExporting,
  isPlaceholder,
  loadedFont,
  onExportPdf,
}: FontInspectorSidebarProps) {
  const scriptSummary = summarizeScripts(detected);
  const summaryFields = fontMetadata
    ? buildFontSummaryFields(fontMetadata, scriptSummary)
    : [];

  return (
    <VStack className="min-h-0" gap={4}>
      {loadedFont && fontMetadata ? (
        <VStack className="w-full" gap={4}>
          <Card className="bg-surface" padding={4}>
            <VStack gap={3}>
              <Heading className="font-sans" level={4}>
                {loadedFont.fullName}
              </Heading>
              <Heading className="font-sans" level={2}>
                {loadedFont.numGlyphs.toLocaleString()} glyphs
              </Heading>
              <HStack gap={2} style={{ flexWrap: "wrap" }}>
                <Badge
                  label={fontMetadata.format.toUpperCase()}
                  variant="neutral"
                />
                <Badge
                  label={formatFileSize(loadedFont.fileSizeBytes)}
                  variant="neutral"
                />
                <Badge label={fontMetadata.weightLabel} variant="neutral" />
              </HStack>
              {isPlaceholder ? (
                <Text color="secondary" type="supporting">
                  Example font — upload yours to inspect it.
                </Text>
              ) : null}
            </VStack>
          </Card>

          <Card className="bg-surface" padding={4}>
            <VStack gap={3}>
              <Text color="secondary" type="supporting">
                METADATA
              </Text>
              <VStack gap={2}>
                {summaryFields.map((field) => (
                  <DetailRow
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
              </VStack>
            </VStack>
          </Card>
        </VStack>
      ) : null}

      <div className="mt-auto">
        <Button
          isDisabled={isPlaceholder}
          isLoading={isExporting}
          label="Export PDF report"
          onClick={onExportPdf}
          variant="secondary"
        />
      </div>
    </VStack>
  );
}

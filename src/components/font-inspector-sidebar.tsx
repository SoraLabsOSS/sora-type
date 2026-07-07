"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { InspectorView } from "@/components/font-inspector";
import {
  buildOneLinerSummary,
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
  hasColor: boolean;
  isExporting: boolean;
  isPlaceholder: boolean;
  loadedFont: LoadedFontSummary | null;
  onExportPdf: () => void;
  onViewChange: (view: InspectorView) => void;
  view: InspectorView;
}

const INSPECTOR_VIEWS: { label: string; value: InspectorView }[] = [
  { label: "Overview", value: "overview" },
  { label: "Raw tables", value: "raw-tables" },
  { label: "Tester", value: "tester" },
  { label: "Layout Features", value: "layout-features" },
  { label: "Color", value: "color" },
  { label: "CSS", value: "css" },
  { label: "Subsetting", value: "subsetting" },
];

export function FontInspectorSidebar({
  detected,
  fontMetadata,
  hasColor,
  isExporting,
  isPlaceholder,
  loadedFont,
  onExportPdf,
  onViewChange,
  view,
}: FontInspectorSidebarProps) {
  const scriptSummary = summarizeScripts(detected);
  const summaryFields = fontMetadata
    ? buildFontSummaryFields(fontMetadata, scriptSummary)
    : [];
  const oneLinerSummary = fontMetadata
    ? buildOneLinerSummary({
        featureCount: fontMetadata.openTypeFeatures.length,
        isColor: hasColor,
        isHinted: fontMetadata.isHinted,
        isVariable: fontMetadata.variationAxes.length > 0,
        languageCount: detected.length,
        outlineFormats: fontMetadata.outlineFormats,
      })
    : "";
  const inspectorViews = hasColor
    ? INSPECTOR_VIEWS
    : INSPECTOR_VIEWS.filter((option) => option.value !== "color");

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
              {oneLinerSummary ? (
                <Text color="secondary" type="supporting">
                  {oneLinerSummary}
                </Text>
              ) : null}
              {isPlaceholder ? (
                <Text color="secondary" type="supporting">
                  Example font — upload yours to inspect it.
                </Text>
              ) : null}
            </VStack>
          </Card>

          <Card className="bg-surface" padding={2}>
            <List className="gap-1" density="compact">
              {inspectorViews.map((option) => (
                <ListItem
                  isSelected={option.value === view}
                  key={option.value}
                  label={option.label}
                  onClick={() => onViewChange(option.value)}
                />
              ))}
            </List>
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
      ) : (
        <Card className="bg-surface" padding={2}>
          <List className="gap-1" density="compact">
            {inspectorViews.map((option) => (
              <ListItem
                isSelected={option.value === view}
                key={option.value}
                label={option.label}
                onClick={() => onViewChange(option.value)}
              />
            ))}
          </List>
        </Card>
      )}

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

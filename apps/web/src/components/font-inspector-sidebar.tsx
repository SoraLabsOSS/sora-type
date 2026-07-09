"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { LanguageSupportResult } from "@sora-type/font-engine/font-language-detection";
import {
  buildFontSummaryFields,
  type FontMetadata,
  formatFileSize,
} from "@sora-type/font-engine/font-metadata";
import { useLocale, useTranslations } from "next-intl";
import type { InspectorView } from "@/components/font-inspector";
import {
  buildOneLinerSummary,
  DetailRow,
  summarizeScripts,
} from "@/components/font-inspector-fields";

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

const INSPECTOR_VIEW_VALUES: InspectorView[] = [
  "overview",
  "raw-tables",
  "tester",
  "layout-features",
  "color",
  "css",
  "subsetting",
];

const VIEW_LABEL_KEY: Record<InspectorView, string> = {
  overview: "overview",
  "raw-tables": "rawTables",
  tester: "tester",
  "layout-features": "layoutFeatures",
  color: "color",
  css: "css",
  subsetting: "subsetting",
};

function InspectorNavItem({
  isSelected,
  label,
  onSelect,
}: {
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <ListItem
      isSelected={isSelected}
      label={
        <Text as="span" type="label" weight="medium">
          {label}
        </Text>
      }
      onClick={onSelect}
    />
  );
}

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
  const t = useTranslations("inspector.sidebar");
  const tSummary = useTranslations("inspector");
  const locale = useLocale();
  const scriptSummary = summarizeScripts(detected, tSummary);
  const summaryFields = fontMetadata
    ? buildFontSummaryFields(fontMetadata, scriptSummary)
    : [];
  const oneLinerSummary = fontMetadata
    ? buildOneLinerSummary(
        {
          featureCount: fontMetadata.openTypeFeatures.length,
          isColor: hasColor,
          isHinted: fontMetadata.isHinted,
          isVariable: fontMetadata.variationAxes.length > 0,
          languageCount: detected.length,
          outlineFormats: fontMetadata.outlineFormats,
        },
        locale,
        tSummary
      )
    : "";
  const inspectorViews = (
    hasColor
      ? INSPECTOR_VIEW_VALUES
      : INSPECTOR_VIEW_VALUES.filter((value) => value !== "color")
  ).map((value) => ({
    value,
    label: t(`views.${VIEW_LABEL_KEY[value]}`),
  }));

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
                {t("glyphsCount", { count: loadedFont.numGlyphs })}
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
                  {t("placeholderNotice")}
                </Text>
              ) : null}
            </VStack>
          </Card>

          <Card className="bg-surface" padding={2}>
            <List className="gap-1" density="compact">
              {inspectorViews.map((option) => (
                <InspectorNavItem
                  isSelected={option.value === view}
                  key={option.value}
                  label={option.label}
                  onSelect={() => onViewChange(option.value)}
                />
              ))}
            </List>
          </Card>

          <Card className="bg-surface" padding={4}>
            <VStack gap={3}>
              <Text color="secondary" type="supporting">
                {t("metadataHeading")}
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
              <InspectorNavItem
                isSelected={option.value === view}
                key={option.value}
                label={option.label}
                onSelect={() => onViewChange(option.value)}
              />
            ))}
          </List>
        </Card>
      )}

      <div className="mt-auto">
        <Button
          isDisabled={isPlaceholder}
          isLoading={isExporting}
          label={t("exportPdf")}
          onClick={onExportPdf}
          variant="secondary"
        />
      </div>
    </VStack>
  );
}

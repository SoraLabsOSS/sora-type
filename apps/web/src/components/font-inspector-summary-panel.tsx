"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import type { OtToHtmlLangEntry } from "@sora-type/font-engine/data/ot-to-html-lang";
import type { AccuracyComparisonResult } from "@sora-type/font-engine/font-benchmark";
import type { LanguageSupportResult } from "@sora-type/font-engine/font-language-detection";
import {
  buildFontDetailFields,
  type FontMetadata,
} from "@sora-type/font-engine/font-metadata";
import type { summarizeSupport } from "@sora-type/font-engine/font-report";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DetailRow } from "@/components/font-inspector-fields";

function boldTag(chunks: ReactNode) {
  return (
    <Text as="span" weight="bold">
      {chunks}
    </Text>
  );
}

interface FontInspectorSummaryPanelProps {
  accuracyDiscrepancies: AccuracyComparisonResult[];
  detected: (LanguageSupportResult & { rowKey: string })[];
  fontMetadata: FontMetadata | null;
  languageSystems: OtToHtmlLangEntry[];
  positioningIssues: (LanguageSupportResult & { rowKey: string })[];
  summary: ReturnType<typeof summarizeSupport> | null;
}

function LanguageSystemsList({
  languageSystems,
}: {
  languageSystems: OtToHtmlLangEntry[];
}) {
  const t = useTranslations("inspector.summaryPanel");

  if (languageSystems.length === 0) {
    return (
      <Text color="secondary" type="supporting">
        {t("noLanguageSystems")}
      </Text>
    );
  }
  return (
    <Text color="secondary" type="supporting">
      {t("languageSystemsDeclared")}{" "}
      {languageSystems.map((entry, index) => (
        <span key={entry.ot}>
          {entry.name} ({entry.html})
          {index < languageSystems.length - 1 ? ", " : "."}
        </span>
      ))}
    </Text>
  );
}

export function FontInspectorSummaryPanel({
  accuracyDiscrepancies,
  detected,
  fontMetadata,
  languageSystems,
  positioningIssues,
  summary,
}: FontInspectorSummaryPanelProps) {
  const t = useTranslations("inspector.summaryPanel");
  const detailFields = fontMetadata ? buildFontDetailFields(fontMetadata) : [];

  return (
    <>
      {fontMetadata ? (
        <VStack className="min-h-0 w-full" gap={4}>
          {summary ? (
            <Card className="bg-surface" padding={4}>
              <Collapsible
                defaultIsOpen
                trigger={
                  <Text type="body">
                    {t.rich("languageSupportTrigger", {
                      count: summary.full,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                <VStack gap={1}>
                  <Text type="body">
                    {t.rich("fullLine", { count: summary.full, b: boldTag })}
                  </Text>
                  <Text type="body">
                    {t.rich("decomposedLine", {
                      count: summary.decomposed,
                      b: boldTag,
                    })}
                  </Text>
                  <Text type="body">
                    {t.rich("positioningFailedLine", {
                      count: summary.positioningFailed,
                      b: boldTag,
                    })}
                  </Text>
                  <Text type="body">
                    {t.rich("unsupportedLine", {
                      count: summary.none,
                      b: boldTag,
                    })}
                  </Text>
                  {accuracyDiscrepancies.length > 0 ? (
                    <Text color="secondary" type="supporting">
                      {t.rich("accuracyDiscrepancy", {
                        count: accuracyDiscrepancies.length,
                        b: boldTag,
                      })}
                    </Text>
                  ) : null}
                </VStack>
              </Collapsible>
            </Card>
          ) : null}

          <Card className="bg-surface" padding={4}>
            <VStack gap={2}>
              <Text color="secondary" type="supporting">
                {t("technical")}
              </Text>

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("openTypeFeatures", {
                      count: fontMetadata.openTypeFeatures.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                {fontMetadata.openTypeFeatures.length > 0 ? (
                  <HStack gap={2} style={{ flexWrap: "wrap" }}>
                    {fontMetadata.openTypeFeatures.map((feature) => (
                      <Badge key={feature} label={feature} variant="neutral" />
                    ))}
                  </HStack>
                ) : (
                  <Text color="secondary" type="supporting">
                    {t("noFeatureTags")}
                  </Text>
                )}
              </Collapsible>

              <Divider variant="subtle" />

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("rawTables", {
                      count: fontMetadata.tables.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                <HStack gap={2} style={{ flexWrap: "wrap" }}>
                  {fontMetadata.tables.map((table) => (
                    <Badge key={table} label={table} variant="neutral" />
                  ))}
                </HStack>
              </Collapsible>

              <Divider variant="subtle" />

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("allFontDetails", {
                      count: detailFields.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                <VStack gap={2}>
                  {detailFields.map((field) => (
                    <DetailRow
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </VStack>
              </Collapsible>

              <Divider variant="subtle" />

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("languagesHeading", {
                      count: detected.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                {detected.length > 0 ? (
                  <VStack gap={2}>
                    <Text color="secondary" type="supporting">
                      {detected.map((lang, index) => (
                        <span key={lang.rowKey}>
                          {lang.name} ({lang.script}
                          {lang.support === "decomposed" ? "*" : ""})
                          {index < detected.length - 1 ? ", " : "."}
                        </span>
                      ))}
                    </Text>
                    {detected.some((lang) => lang.support === "decomposed") ? (
                      <Text color="secondary" type="supporting">
                        {t("decomposedNote")}
                      </Text>
                    ) : null}
                  </VStack>
                ) : null}
              </Collapsible>

              <Divider variant="subtle" />

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("languageSystemsHeading", {
                      count: languageSystems.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                <LanguageSystemsList languageSystems={languageSystems} />
              </Collapsible>
            </VStack>
          </Card>

          {positioningIssues.length > 0 ? (
            <Card className="bg-surface" padding={4}>
              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    {t.rich("positioningIssuesHeading", {
                      count: positioningIssues.length,
                      b: boldTag,
                    })}
                  </Text>
                }
              >
                <VStack gap={2}>
                  <Text color="secondary" type="supporting">
                    {t("positioningIssuesNote")}
                  </Text>
                  <List hasDividers header={t("positioningIssuesListHeader")}>
                    {positioningIssues.map((lang) => (
                      <ListItem
                        description={`${lang.script} · ${lang.unpositioned.join(", ")}`}
                        endContent={
                          <Badge
                            label={t("positioningFailedBadge")}
                            variant="warning"
                          />
                        }
                        key={lang.rowKey}
                        label={lang.name}
                      />
                    ))}
                  </List>
                </VStack>
              </Collapsible>
            </Card>
          ) : null}
        </VStack>
      ) : null}
    </>
  );
}

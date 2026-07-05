"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { DetailRow } from "@/components/font-inspector-fields";
import { SummaryPanelSkeleton } from "@/components/font-inspector-shell";
import { SkeletonTransition } from "@/components/ui/skeleton";
import type { LanguageSupportResult } from "@/lib/font-language-detection";
import { buildFontDetailFields, type FontMetadata } from "@/lib/font-metadata";
import type { summarizeSupport } from "@/lib/font-report";

interface FontInspectorSummaryPanelProps {
  detected: (LanguageSupportResult & { rowKey: string })[];
  fontMetadata: FontMetadata | null;
  isContentReady: boolean;
  positioningIssues: (LanguageSupportResult & { rowKey: string })[];
  summary: ReturnType<typeof summarizeSupport> | null;
}

export function FontInspectorSummaryPanel({
  detected,
  fontMetadata,
  isContentReady,
  positioningIssues,
  summary,
}: FontInspectorSummaryPanelProps) {
  const detailFields = fontMetadata ? buildFontDetailFields(fontMetadata) : [];

  return (
    <SkeletonTransition
      loading={!isContentReady}
      skeleton={<SummaryPanelSkeleton />}
    >
      {fontMetadata ? (
        <VStack className="min-h-0 w-full" gap={4}>
          {summary ? (
            <Card className="bg-surface" padding={4}>
              <Collapsible
                defaultIsOpen
                trigger={
                  <Text type="body">
                    Language support ·{" "}
                    <Text as="span" weight="bold">
                      {summary.full}
                    </Text>
                    {" full"}
                  </Text>
                }
              >
                <VStack gap={1}>
                  <Text type="body">
                    <b>{summary.full}</b> full
                  </Text>
                  <Text type="body">
                    <b>{summary.decomposed}</b> decomposed
                  </Text>
                  <Text type="body">
                    <b>{summary.positioningFailed}</b> positioning failed
                  </Text>
                  <Text type="body">
                    <b>{summary.none}</b> unsupported
                  </Text>
                </VStack>
              </Collapsible>
            </Card>
          ) : null}

          <Card className="bg-surface" padding={4}>
            <VStack gap={2}>
              <Text color="secondary" type="supporting">
                TECHNICAL
              </Text>

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    OpenType features (
                    <Text as="span" weight="bold">
                      {fontMetadata.openTypeFeatures.length}
                    </Text>
                    )
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
                    No GSUB/GPOS feature tags detected.
                  </Text>
                )}
              </Collapsible>

              <Divider variant="subtle" />

              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    Raw tables (
                    <Text as="span" weight="bold">
                      {fontMetadata.tables.length}
                    </Text>
                    )
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
                    All font details (
                    <Text as="span" weight="bold">
                      {detailFields.length}
                    </Text>
                    )
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
                    Languages (
                    <Text as="span" weight="bold">
                      {detected.length}
                    </Text>
                    )
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
                        * supported via combining marks, not a precomposed glyph
                      </Text>
                    ) : null}
                  </VStack>
                ) : null}
              </Collapsible>
            </VStack>
          </Card>

          {positioningIssues.length > 0 ? (
            <Card className="bg-surface" padding={4}>
              <Collapsible
                defaultIsOpen={false}
                trigger={
                  <Text type="body">
                    Positioning issues (
                    <Text as="span" weight="bold">
                      {positioningIssues.length}
                    </Text>
                    )
                  </Text>
                }
              >
                <VStack gap={2}>
                  <Text color="secondary" type="supporting">
                    Glyphs exist but GPOS does not position combining marks
                    correctly.
                  </Text>
                  <List hasDividers header="Positioning issues">
                    {positioningIssues.map((lang) => (
                      <ListItem
                        description={`${lang.script} · ${lang.unpositioned.join(", ")}`}
                        endContent={
                          <Badge label="positioning failed" variant="warning" />
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
    </SkeletonTransition>
  );
}

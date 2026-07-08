"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  buildFontDetailFields,
  type FontMetadata,
} from "@sora-type/font-engine/font-metadata";
import { useTranslations } from "next-intl";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      gap={3}
      style={{ alignItems: "baseline", justifyContent: "space-between" }}
    >
      <Text color="secondary" type="supporting">
        {label}
      </Text>
      <Text
        style={{ maxWidth: "72%", textAlign: "end", wordBreak: "break-word" }}
        type="body"
      >
        {value}
      </Text>
    </HStack>
  );
}

interface FontInspectorDetailsProps {
  metadata: FontMetadata;
}

export function FontInspectorDetails({ metadata }: FontInspectorDetailsProps) {
  const t = useTranslations("inspector.details");
  const detailFields = buildFontDetailFields(metadata);
  const featureCount = metadata.openTypeFeatures.length;
  const tableCount = metadata.tables.length;
  const hasVariableAxes = metadata.variationAxes.length > 0;

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading className="font-sans" level={3}>
          {t("heading")}
        </Heading>
        <VStack gap={2}>
          {detailFields.map((field) => (
            <DetailRow
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </VStack>
      </VStack>

      {hasVariableAxes ? (
        <VStack gap={2}>
          <Divider variant="subtle" />
          <Heading className="font-sans" level={3}>
            {t("variableAxesHeading", { count: metadata.variationAxes.length })}
          </Heading>
          <VStack gap={2}>
            {metadata.variationAxes.map((axis) => (
              <DetailRow
                key={axis.tag}
                label={`${axis.name} (${axis.tag})`}
                value={`${axis.min} / ${axis.default} / ${axis.max}`}
              />
            ))}
          </VStack>
        </VStack>
      ) : null}

      <VStack gap={2}>
        <Divider variant="subtle" />
        <Collapsible
          defaultIsOpen={featureCount > 0}
          trigger={
            <Text type="body">
              {featureCount > 0
                ? t.rich("featuresDetectedWithCount", {
                    count: featureCount,
                    b: (chunks) => (
                      <Text as="span" weight="bold">
                        {chunks}
                      </Text>
                    ),
                  })
                : t("noFeatures")}
            </Text>
          }
        >
          {featureCount > 0 ? (
            <HStack gap={2} style={{ flexWrap: "wrap" }}>
              {metadata.openTypeFeatures.map((feature) => (
                <Badge key={feature} label={feature} variant="neutral" />
              ))}
            </HStack>
          ) : (
            <Text color="secondary" type="supporting">
              {t("noFeatureTags")}
            </Text>
          )}
        </Collapsible>
      </VStack>

      <VStack gap={2}>
        <Divider variant="subtle" />
        <Collapsible
          defaultIsOpen={false}
          trigger={
            <Text type="body">
              {t.rich("tablesHeading", {
                count: tableCount,
                b: (chunks) => (
                  <Text as="span" weight="bold">
                    {chunks}
                  </Text>
                ),
              })}
            </Text>
          }
        >
          <HStack gap={2} style={{ flexWrap: "wrap" }}>
            {metadata.tables.map((table) => (
              <Badge key={table} label={table} variant="neutral" />
            ))}
          </HStack>
        </Collapsible>
      </VStack>
    </VStack>
  );
}

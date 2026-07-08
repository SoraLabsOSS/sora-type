"use client";

import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { hasColorPalettes } from "@sora-type/font-engine/font-color-palettes";
import type { FontMetadata } from "@sora-type/font-engine/font-metadata";
import { generateStylesheet } from "@sora-type/font-engine/font-stylesheet";
import { getNamedInstances } from "@sora-type/font-engine/font-variable-instances";
import { getFeatureAlternateCounts } from "@sora-type/font-engine/opentype-feature-alternates";
import { getFeatureVariantCss } from "@sora-type/font-engine/opentype-feature-variants";
import { computeUnicodeRanges } from "@sora-type/font-engine/unicode-ranges";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface FontInspectorStylesheetProps {
  fileName: string;
  font: FontkitFont;
  metadata: FontMetadata;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export function FontInspectorStylesheet({
  fileName,
  font,
  metadata,
}: FontInspectorStylesheetProps) {
  const t = useTranslations("inspector.stylesheet");
  const [namespace, setNamespace] = useState(() =>
    slugify(metadata.familyName)
  );
  const [includeUnicodeRange, setIncludeUnicodeRange] = useState(false);
  const [includeDefaultOnFeatures, setIncludeDefaultOnFeatures] =
    useState(false);
  const [useNativeAxisCss, setUseNativeAxisCss] = useState(true);
  const [fontFeatureSettingsOnly, setFontFeatureSettingsOnly] = useState(false);
  const [includeColorPalettes, setIncludeColorPalettes] = useState(true);
  const [copied, setCopied] = useState(false);

  const instances = useMemo(() => getNamedInstances(font), [font]);
  const featureAlternateCounts = useMemo(
    () => getFeatureAlternateCounts(font),
    [font]
  );
  const unicodeRanges = useMemo(
    () => (includeUnicodeRange ? computeUnicodeRanges(font.characterSet) : []),
    [font, includeUnicodeRange]
  );

  const hasNativeAxis = metadata.variationAxes.some(
    (axis) => axis.tag === "wght" || axis.tag === "wdth"
  );
  const hasVariantFeature = metadata.openTypeFeatures.some(
    (tag) => getFeatureVariantCss(tag) !== null
  );
  const hasPalettes = useMemo(() => hasColorPalettes(font), [font]);

  const css = useMemo(
    () =>
      generateStylesheet(font, metadata, instances, featureAlternateCounts, {
        fileName,
        fontFeatureSettingsOnly,
        includeColorPalettes,
        includeDefaultOnFeatures,
        includeFeatures: null,
        includeUnicodeRange,
        namespace,
        skipAxes: [],
        unicodeRanges,
        useNativeAxisCss,
      }),
    [
      font,
      metadata,
      instances,
      featureAlternateCounts,
      fileName,
      fontFeatureSettingsOnly,
      includeColorPalettes,
      includeDefaultOnFeatures,
      includeUnicodeRange,
      namespace,
      unicodeRanges,
      useNativeAxisCss,
    ]
  );

  const copyCss = () => {
    navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const downloadCss = () => {
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${namespace || "font"}.css`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack gap={4}>
      <Card className="bg-surface" padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            {t("heading")}
          </Heading>
          <Text color="secondary" type="supporting">
            {t.rich("description", { code: (chunks) => <code>{chunks}</code> })}
          </Text>

          <TextInput
            description={t("namespaceDescription")}
            label={t("namespaceLabel")}
            onChange={setNamespace}
            value={namespace}
          />

          <VStack gap={2}>
            <Switch
              label={t("includeUnicodeRange")}
              onChange={setIncludeUnicodeRange}
              value={includeUnicodeRange}
            />
            <Switch
              label={t("includeDefaultOnFeatures")}
              onChange={setIncludeDefaultOnFeatures}
              value={includeDefaultOnFeatures}
            />
            {hasNativeAxis && (
              <Switch
                description={t("useNativeAxisDescription")}
                label={t("useNativeAxis")}
                onChange={setUseNativeAxisCss}
                value={useNativeAxisCss}
              />
            )}
            {hasVariantFeature && (
              <Switch
                description={t("fontFeatureSettingsOnlyDescription")}
                label={t("fontFeatureSettingsOnly")}
                onChange={setFontFeatureSettingsOnly}
                value={fontFeatureSettingsOnly}
              />
            )}
            {hasPalettes && (
              <Switch
                description={t("includeColorPalettesDescription")}
                label={t("includeColorPalettes")}
                onChange={setIncludeColorPalettes}
                value={includeColorPalettes}
              />
            )}
          </VStack>

          <HStack gap={2} style={{ justifyContent: "flex-end" }}>
            <IconButton
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              label={t("copyStylesheet")}
              onClick={copyCss}
              size="sm"
              variant="ghost"
            />
            <Button
              label={t("downloadStylesheet")}
              onClick={downloadCss}
              size="sm"
              variant="secondary"
            />
          </HStack>

          <pre className="max-h-[32rem] overflow-auto rounded-md border border-border bg-body px-3 py-2 font-mono text-xs">
            {css}
          </pre>
        </VStack>
      </Card>
    </VStack>
  );
}

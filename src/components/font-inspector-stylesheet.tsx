"use client";

import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { hasColorPalettes } from "@/lib/font-color-palettes";
import type { FontMetadata } from "@/lib/font-metadata";
import { generateStylesheet } from "@/lib/font-stylesheet";
import { getNamedInstances } from "@/lib/font-variable-instances";
import { getFeatureAlternateCounts } from "@/lib/opentype-feature-alternates";
import { getFeatureVariantCss } from "@/lib/opentype-feature-variants";
import { computeUnicodeRanges } from "@/lib/unicode-ranges";

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
            CSS
          </Heading>
          <Text color="secondary" type="supporting">
            A ready-to-use stylesheet for this font — <code>@font-face</code>, a
            toggleable class per OpenType layout feature, and a class per
            variable-font instance. Classes use CSS custom properties so you can
            combine several at once without them overriding each other.
          </Text>

          <TextInput
            description="Prefix for every generated class and custom property, so multiple fonts' CSS don't collide."
            label="Namespace"
            onChange={setNamespace}
            value={namespace}
          />

          <VStack gap={2}>
            <Switch
              label="Include unicode-range"
              onChange={setIncludeUnicodeRange}
              value={includeUnicodeRange}
            />
            <Switch
              label="Include on-by-default features"
              onChange={setIncludeDefaultOnFeatures}
              value={includeDefaultOnFeatures}
            />
            {hasNativeAxis && (
              <Switch
                description="Map wght/wdth to font-weight/font-stretch instead of raw font-variation-settings."
                label="Use native font-weight/font-stretch"
                onChange={setUseNativeAxisCss}
                value={useNativeAxisCss}
              />
            )}
            {hasVariantFeature && (
              <Switch
                description="Skip font-variant-* properties (e.g. small-caps) and always use font-feature-settings."
                label="Use font-feature-settings only"
                onChange={setFontFeatureSettingsOnly}
                value={fontFeatureSettingsOnly}
              />
            )}
            {hasPalettes && (
              <Switch
                description="Adds @font-palette-values and a toggle class for each extra CPAL color palette."
                label="Include color palettes"
                onChange={setIncludeColorPalettes}
                value={includeColorPalettes}
              />
            )}
          </VStack>

          <HStack gap={2} style={{ justifyContent: "flex-end" }}>
            <IconButton
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              label="Copy stylesheet"
              onClick={copyCss}
              size="sm"
              variant="ghost"
            />
            <Button
              label="Download stylesheet"
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

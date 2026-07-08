"use client";

import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Slider } from "@astryxdesign/core/Slider";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useTranslations } from "next-intl";

const DEFAULT_FONT_SIZE = 32;
const PREVIEW_MIN_HEIGHT = "8.5rem";

interface FontInspectorPreviewProps {
  cssFontFamily: string | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onPreviewTextChange: (text: string) => void;
  previewText: string;
  weightLabel?: string;
}

export function FontInspectorPreview({
  cssFontFamily,
  fontSize,
  onFontSizeChange,
  onPreviewTextChange,
  previewText,
  weightLabel,
}: FontInspectorPreviewProps) {
  const t = useTranslations("inspector.preview");

  return (
    <Card className="min-w-0 bg-surface" padding={4}>
      <VStack gap={3}>
        <Heading className="font-sans" level={3}>
          {t("heading")}
        </Heading>

        <VStack gap={2}>
          <HStack
            gap={3}
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            {weightLabel ? (
              <Text color="secondary" type="supporting">
                {weightLabel}
              </Text>
            ) : (
              <span />
            )}
            <Text className="tabular-nums" color="secondary" type="supporting">
              {fontSize}px
            </Text>
          </HStack>
          <Slider
            formatValue={(value) => `${value}px`}
            isLabelHidden
            label={t("fontSize")}
            max={96}
            min={12}
            onChange={onFontSizeChange}
            value={fontSize}
          />
        </VStack>

        <textarea
          className="w-full resize-y rounded-md border border-border bg-body px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus-visible:border-accent"
          onChange={(event) => onPreviewTextChange(event.target.value)}
          placeholder={t("placeholder")}
          spellCheck={false}
          style={{
            fontFamily: cssFontFamily ?? "inherit",
            fontSize,
            lineHeight: 1.35,
            minHeight: PREVIEW_MIN_HEIGHT,
          }}
          value={previewText}
        />
      </VStack>
    </Card>
  );
}

export { DEFAULT_FONT_SIZE };

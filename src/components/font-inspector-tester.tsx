"use client";

import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Slider } from "@astryxdesign/core/Slider";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  ToggleButton,
  ToggleButtonGroup,
} from "@astryxdesign/core/ToggleButton";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import type { FontMetadata } from "@/lib/font-metadata";
import { getNamedInstances } from "@/lib/font-variable-instances";

const DEFAULT_TESTER_TEXT =
  "The quick brown fox jumps over the lazy dog. 0123456789";
const DEFAULT_FONT_SIZE = 32;

type TextAlign = "center" | "justify" | "left" | "right";

interface FontInspectorTesterProps {
  cssFontFamily: string | null;
  font: FontkitFont;
  metadata: FontMetadata;
}

function buildVariationSettings(values: Record<string, number>): string {
  const parts = Object.entries(values).map(
    ([tag, value]) => `"${tag}" ${value}`
  );
  return parts.join(", ");
}

export function FontInspectorTester({
  cssFontFamily,
  font,
  metadata,
}: FontInspectorTesterProps) {
  const [text, setText] = useState(DEFAULT_TESTER_TEXT);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [axisValues, setAxisValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      metadata.variationAxes.map((axis) => [axis.tag, axis.default])
    )
  );
  const hasOpticalSize = metadata.variationAxes.some(
    (axis) => axis.tag === "opsz"
  );
  const [autoOpticalSizing, setAutoOpticalSizing] = useState(true);
  const [showInstancePreviews, setShowInstancePreviews] = useState(false);
  const [copied, setCopied] = useState(false);

  const namedInstances = useMemo(() => getNamedInstances(font), [font]);
  const activeInstanceName = useMemo(() => {
    const match = namedInstances.find((instance) =>
      Object.entries(instance.values).every(
        ([tag, value]) => axisValues[tag] === value
      )
    );
    return match?.name ?? null;
  }, [namedInstances, axisValues]);

  // Excludes opsz while "Automatic optical sizing" is on, so the browser's
  // own font-size-driven optical sizing (font-optical-sizing: auto, the CSS
  // default) applies instead of a value pinned by the slider.
  const effectiveAxisValues = useMemo(() => {
    if (!(hasOpticalSize && autoOpticalSizing)) {
      return axisValues;
    }
    const { opsz: _opsz, ...rest } = axisValues;
    return rest;
  }, [axisValues, hasOpticalSize, autoOpticalSizing]);
  const variationSettings = useMemo(
    () => buildVariationSettings(effectiveAxisValues),
    [effectiveAxisValues]
  );
  const opticalSizingCss =
    hasOpticalSize && !autoOpticalSizing ? "font-optical-sizing: none;" : null;
  const generatedCss = [
    variationSettings ? `font-variation-settings: ${variationSettings};` : null,
    opticalSizingCss,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const copyGeneratedCss = () => {
    navigator.clipboard.writeText(generatedCss).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const setAxisValue = (tag: string, value: number) => {
    setAxisValues((prev) => ({ ...prev, [tag]: value }));
  };

  const selectInstance = (name: string | null) => {
    const instance = namedInstances.find((entry) => entry.name === name);
    if (instance) {
      setAxisValues((prev) => ({ ...prev, ...instance.values }));
    }
  };

  return (
    <VStack gap={4}>
      <Card className="bg-surface" padding={4}>
        <VStack gap={3}>
          <HStack align="center" gap={2} justify="between">
            <Heading className="font-sans" level={3}>
              Tester
            </Heading>
            <ToggleButtonGroup
              label="Text alignment"
              onChange={(value) => setTextAlign((value as TextAlign) ?? "left")}
              size="sm"
              type="single"
              value={textAlign}
            >
              <ToggleButton label="Left" value="left" />
              <ToggleButton label="Center" value="center" />
              <ToggleButton label="Right" value="right" />
              <ToggleButton label="Justify" value="justify" />
            </ToggleButtonGroup>
          </HStack>

          <VStack gap={2}>
            <HStack
              gap={3}
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Text color="secondary" type="supporting">
                Font size
              </Text>
              <Text
                className="tabular-nums"
                color="secondary"
                type="supporting"
              >
                {fontSize}px
              </Text>
            </HStack>
            <Slider
              formatValue={(value) => `${value}px`}
              isLabelHidden
              label="Font size"
              max={144}
              min={8}
              onChange={setFontSize}
              value={fontSize}
            />
          </VStack>

          <div
            className="w-full rounded-md border border-border bg-body px-4 py-3 text-primary outline-none focus-visible:border-accent"
            contentEditable
            dir="auto"
            onInput={(event) => setText(event.currentTarget.textContent ?? "")}
            spellCheck={false}
            style={{
              fontFamily: cssFontFamily ?? "inherit",
              fontOpticalSizing: opticalSizingCss ? "none" : undefined,
              fontSize,
              fontVariationSettings: variationSettings || undefined,
              lineHeight: 1.35,
              minHeight: "8.5rem",
              textAlign,
            }}
            suppressContentEditableWarning
          >
            {text}
          </div>
        </VStack>
      </Card>

      {metadata.variationAxes.length > 0 && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={3}>
            <Heading className="font-sans" level={4}>
              Variable axes
            </Heading>

            {namedInstances.length > 0 && (
              <Selector
                description={`This font has ${namedInstances.length} preconfigured instance${namedInstances.length === 1 ? "" : "s"}.`}
                hasClear
                label="Instance"
                onChange={selectInstance}
                options={namedInstances.map((instance) => instance.name)}
                value={activeInstanceName}
              />
            )}

            {hasOpticalSize && (
              <Switch
                description="Let the browser pick the optical-size axis value from the rendered font size, instead of the slider below."
                label="Automatic optical sizing"
                onChange={setAutoOpticalSizing}
                value={autoOpticalSizing}
              />
            )}

            {metadata.variationAxes.map((axis) => {
              const isAutoOpticalSize =
                axis.tag === "opsz" && hasOpticalSize && autoOpticalSizing;
              return (
                <VStack gap={1} key={axis.tag}>
                  <HStack
                    gap={3}
                    style={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text color="secondary" type="supporting">
                      {axis.name} ({axis.tag})
                    </Text>
                    <NumberInput
                      isDisabled={isAutoOpticalSize}
                      isLabelHidden
                      label={axis.name}
                      max={axis.max}
                      min={axis.min}
                      onChange={(value) =>
                        value !== null && setAxisValue(axis.tag, value)
                      }
                      step={axis.max - axis.min <= 1 ? 0.01 : 1}
                      value={axisValues[axis.tag] ?? axis.default}
                      width={96}
                    />
                  </HStack>
                  <Slider
                    formatValue={(value) => String(value)}
                    isDisabled={isAutoOpticalSize}
                    isLabelHidden
                    label={axis.name}
                    max={axis.max}
                    min={axis.min}
                    onChange={(value: number) => setAxisValue(axis.tag, value)}
                    step={axis.max - axis.min <= 1 ? 0.01 : 1}
                    value={axisValues[axis.tag] ?? axis.default}
                  />
                </VStack>
              );
            })}

            {generatedCss && (
              <VStack gap={1}>
                <HStack align="center" gap={2} justify="between">
                  <Text color="secondary" type="supporting">
                    Generated CSS
                  </Text>
                  <IconButton
                    icon={copied ? <Check size={14} /> : <Copy size={14} />}
                    label="Copy CSS to clipboard"
                    onClick={copyGeneratedCss}
                    size="sm"
                    variant="ghost"
                  />
                </HStack>
                <pre className="overflow-x-auto rounded-md border border-border bg-body px-3 py-2 font-mono text-xs">
                  {generatedCss}
                </pre>
              </VStack>
            )}

            {namedInstances.length > 0 && (
              <VStack gap={2}>
                <Switch
                  label="Show instance previews"
                  onChange={setShowInstancePreviews}
                  value={showInstancePreviews}
                />
                {showInstancePreviews && (
                  <VStack gap={3}>
                    {namedInstances.map((instance) => (
                      <VStack gap={1} key={instance.name}>
                        <Text color="secondary" type="supporting">
                          {instance.name}
                        </Text>
                        <div
                          className="w-full rounded-md border border-border bg-body px-4 py-3 text-primary"
                          style={{
                            fontFamily: cssFontFamily ?? "inherit",
                            fontSize: DEFAULT_FONT_SIZE,
                            fontVariationSettings: buildVariationSettings(
                              instance.values
                            ),
                          }}
                        >
                          {text}
                        </div>
                      </VStack>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

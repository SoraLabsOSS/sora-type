"use client";

import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  ToggleButton,
  ToggleButtonGroup,
} from "@astryxdesign/core/ToggleButton";
import type { FontMetadata } from "@sora-type/font-engine/font-metadata";
import { getFeatureAlternateCounts } from "@sora-type/font-engine/opentype-feature-alternates";
import { isToggleableFeature } from "@sora-type/font-engine/opentype-feature-classification";
import {
  getFeatureUiName,
  getOpenTypeFeatureName,
} from "@sora-type/font-engine/opentype-feature-names";
import { createFeatureSampleFinder } from "@sora-type/font-engine/opentype-feature-samples";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const DEFAULT_DEMO_TEXT =
  "The quick brown fox jumps over the lazy dog. 0123456789";
const ALTERNATE_PREVIEW_CAP = 20;

type FeatureState = "default" | "off" | "on";

interface AlternatePreviewRowProps {
  alternateCount: number;
  cssFontFamily: string | null;
  demoText: string;
  tag: string;
}

/** Side-by-side preview of every alternate a feature offers, one box per
 * `font-feature-settings: "tag" N` value — capped to avoid rendering
 * hundreds of boxes for decorative fonts with large `aalt` counts. */
function AlternatePreviewRow({
  alternateCount,
  cssFontFamily,
  demoText,
  tag,
}: AlternatePreviewRowProps) {
  const t = useTranslations("inspector.layoutFeatures");
  const [expanded, setExpanded] = useState(false);
  const shown =
    expanded || alternateCount <= ALTERNATE_PREVIEW_CAP
      ? alternateCount
      : ALTERNATE_PREVIEW_CAP;

  return (
    <VStack gap={2}>
      <HStack gap={2} style={{ flexWrap: "wrap" }}>
        {Array.from({ length: shown }, (_, index) => index + 1).map((n) => (
          <div
            className="rounded-md border border-border bg-body px-3 py-2 text-primary"
            key={n}
            style={{
              fontFamily: cssFontFamily ?? "inherit",
              fontFeatureSettings: `"${tag}" ${n}`,
            }}
            title={`"${tag}" ${n}`}
          >
            {demoText}
          </div>
        ))}
      </HStack>
      {alternateCount > ALTERNATE_PREVIEW_CAP && (
        <Button
          label={
            expanded
              ? t("showFewerAlternates")
              : t("showAllAlternates", { count: alternateCount })
          }
          onClick={() => setExpanded((prev) => !prev)}
          size="sm"
          variant="ghost"
        />
      )}
    </VStack>
  );
}

interface FontInspectorLayoutFeaturesProps {
  cssFontFamily: string | null;
  font: FontkitFont;
  metadata: FontMetadata;
}

// Just the property *value* (e.g. `"dnom" 1`) — for the `style` prop, which
// needs the bare value, not a full `property: value;` declaration.
function buildFeatureValue(
  tag: string,
  state: FeatureState,
  alternate: number
): string | null {
  if (state === "default") {
    return null;
  }
  const value = state === "on" ? alternate : 0;
  return `"${tag}" ${value}`;
}

export function FontInspectorLayoutFeatures({
  cssFontFamily,
  font,
  metadata,
}: FontInspectorLayoutFeaturesProps) {
  const t = useTranslations("inspector.layoutFeatures");
  const requiredFeatures = useMemo(
    () => metadata.openTypeFeatures.filter((tag) => !isToggleableFeature(tag)),
    [metadata.openTypeFeatures]
  );
  const toggleableFeatures = useMemo(
    () => metadata.openTypeFeatures.filter(isToggleableFeature),
    [metadata.openTypeFeatures]
  );
  const featureAlternateCounts = useMemo(
    () => getFeatureAlternateCounts(font),
    [font]
  );
  // Real characters this font's own GSUB lookups say each feature affects,
  // so the demo text shows something meaningful by default instead of a
  // shared pangram the feature may have nothing to act on.
  const featureSamples = useMemo(() => {
    const findSample = createFeatureSampleFinder(font);
    return Object.fromEntries(
      toggleableFeatures.map((tag) => [tag, findSample(tag)])
    );
  }, [font, toggleableFeatures]);

  const [demoTexts, setDemoTexts] = useState<Record<string, string>>({});
  const [featureStates, setFeatureStates] = useState<
    Record<string, FeatureState>
  >({});
  const [alternateSelections, setAlternateSelections] = useState<
    Record<string, number>
  >({});
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const setFeatureState = (tag: string, state: FeatureState | null) => {
    setFeatureStates((prev) => ({ ...prev, [tag]: state ?? "default" }));
  };

  const setAlternateSelection = (tag: string, alternate: number) => {
    setAlternateSelections((prev) => ({ ...prev, [tag]: alternate }));
  };

  const setDemoText = (tag: string, value: string) => {
    setDemoTexts((prev) => ({ ...prev, [tag]: value }));
  };

  const copyFeatureCss = (tag: string, css: string) => {
    navigator.clipboard.writeText(css).then(() => {
      setCopiedTag(tag);
      setTimeout(
        () => setCopiedTag((current) => (current === tag ? null : current)),
        1500
      );
    });
  };

  if (metadata.openTypeFeatures.length === 0) {
    return (
      <Text color="secondary" type="supporting">
        {t("empty")}
      </Text>
    );
  }

  return (
    <VStack gap={4}>
      {requiredFeatures.length > 0 && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={2}>
            <Heading className="font-sans" level={4}>
              {t("requiredHeading")}
            </Heading>
            <Text color="secondary" type="supporting">
              {t("requiredDescription")}
            </Text>
            <VStack gap={1}>
              {requiredFeatures.map((tag) => (
                <HStack gap={2} key={tag} style={{ alignItems: "center" }}>
                  <span className="font-mono text-secondary text-xs">
                    {tag}
                  </span>
                  <Text>
                    {getFeatureUiName(font, tag) ?? getOpenTypeFeatureName(tag)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Card>
      )}

      {toggleableFeatures.length > 0 && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={2}>
            <Heading className="font-sans" level={4}>
              {t("optionalHeading")}
            </Heading>
            <Text color="secondary" type="supporting">
              {t("optionalDescription")}
            </Text>

            <VStack gap={5}>
              {toggleableFeatures.map((tag) => {
                const alternateCount = featureAlternateCounts[tag] ?? 0;
                const state = featureStates[tag] ?? "default";
                const alternate = alternateSelections[tag] ?? 1;
                const featureValue = buildFeatureValue(tag, state, alternate);
                const css = featureValue
                  ? `font-feature-settings: ${featureValue};`
                  : null;
                const demoText =
                  demoTexts[tag] ?? featureSamples[tag] ?? DEFAULT_DEMO_TEXT;

                return (
                  <VStack gap={2} key={tag}>
                    <HStack
                      gap={3}
                      style={{
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>
                        <span className="font-mono text-secondary text-xs">
                          {tag}
                        </span>{" "}
                        {getFeatureUiName(font, tag) ??
                          getOpenTypeFeatureName(tag)}
                      </Text>
                      <ToggleButtonGroup
                        label={t("stateLabel", { tag })}
                        onChange={(value) =>
                          setFeatureState(tag, value as FeatureState | null)
                        }
                        size="sm"
                        type="single"
                        value={state}
                      >
                        <ToggleButton label={t("default")} value="default" />
                        <ToggleButton label={t("on")} value="on" />
                        <ToggleButton label={t("off")} value="off" />
                      </ToggleButtonGroup>
                    </HStack>

                    {alternateCount > 1 && state === "on" && (
                      <>
                        <Selector
                          hasClear={false}
                          isLabelHidden
                          label={t("alternateLabel", { tag })}
                          onChange={(value) =>
                            setAlternateSelection(tag, Number(value))
                          }
                          options={Array.from(
                            { length: alternateCount },
                            (_, index) => String(index + 1)
                          )}
                          value={String(alternate)}
                        />
                        <AlternatePreviewRow
                          alternateCount={alternateCount}
                          cssFontFamily={cssFontFamily}
                          demoText={demoText}
                          tag={tag}
                        />
                      </>
                    )}

                    {/* Remount when feature value changes so shaping refreshes reliably. */}
                    <textarea
                      className="w-full resize-y rounded-md border border-border bg-body px-4 py-3 text-primary outline-none transition-colors focus-visible:border-accent"
                      key={featureValue ?? "default"}
                      onChange={(event) => setDemoText(tag, event.target.value)}
                      spellCheck={false}
                      style={{
                        fontFamily: cssFontFamily ?? "inherit",
                        fontFeatureSettings: featureValue ?? undefined,
                        fontSize: 28,
                      }}
                      value={demoText}
                    />

                    {css && (
                      <HStack
                        gap={2}
                        style={{
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-body px-3 py-2 font-mono text-xs">
                          {css}
                        </pre>
                        <IconButton
                          icon={
                            copiedTag === tag ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )
                          }
                          label={t("copyFeatureCss", { tag })}
                          onClick={() => copyFeatureCss(tag, css)}
                          size="sm"
                          variant="ghost"
                        />
                      </HStack>
                    )}
                  </VStack>
                );
              })}
            </VStack>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

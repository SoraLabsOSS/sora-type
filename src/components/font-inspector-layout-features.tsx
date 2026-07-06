"use client";

import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  ToggleButton,
  ToggleButtonGroup,
} from "@astryxdesign/core/ToggleButton";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import type { FontMetadata } from "@/lib/font-metadata";
import { getFeatureAlternateCounts } from "@/lib/opentype-feature-alternates";
import { isToggleableFeature } from "@/lib/opentype-feature-classification";
import { getOpenTypeFeatureName } from "@/lib/opentype-feature-names";
import { createFeatureSampleFinder } from "@/lib/opentype-feature-samples";

const DEFAULT_DEMO_TEXT =
  "The quick brown fox jumps over the lazy dog. 0123456789";

type FeatureState = "default" | "off" | "on";

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
        This font doesn't define any OpenType layout features.
      </Text>
    );
  }

  return (
    <VStack gap={4}>
      {requiredFeatures.length > 0 && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={2}>
            <Heading className="font-sans" level={4}>
              Required layout features
            </Heading>
            <Text color="secondary" type="supporting">
              These are always applied by the text-shaping engine — you can't
              turn them off, and aren't meant to.
            </Text>
            <VStack gap={1}>
              {requiredFeatures.map((tag) => (
                <HStack gap={2} key={tag} style={{ alignItems: "center" }}>
                  <span className="font-mono text-secondary text-xs">
                    {tag}
                  </span>
                  <Text>{getOpenTypeFeatureName(tag)}</Text>
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
              Optional layout features
            </Heading>
            <Text color="secondary" type="supporting">
              Some are on by default and can be turned off; others are off by
              default and can be turned on.
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
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>
                        <span className="font-mono text-secondary text-xs">
                          {tag}
                        </span>{" "}
                        {getOpenTypeFeatureName(tag)}
                      </Text>
                      <ToggleButtonGroup
                        label={`${tag} state`}
                        onChange={(value) =>
                          setFeatureState(tag, value as FeatureState | null)
                        }
                        size="sm"
                        type="single"
                        value={state}
                      >
                        <ToggleButton label="Default" value="default" />
                        <ToggleButton label="On" value="on" />
                        <ToggleButton label="Off" value="off" />
                      </ToggleButtonGroup>
                    </HStack>

                    {alternateCount > 1 && state === "on" && (
                      <Selector
                        hasClear={false}
                        isLabelHidden
                        label={`${tag} alternate`}
                        onChange={(value) =>
                          setAlternateSelection(tag, Number(value))
                        }
                        options={Array.from(
                          { length: alternateCount },
                          (_, index) => String(index + 1)
                        )}
                        value={String(alternate)}
                      />
                    )}

                    <div
                      className="w-full rounded-md border border-border bg-body px-4 py-3 text-primary outline-none focus-visible:border-accent"
                      contentEditable
                      // Remounts the node whenever the applied feature value
                      // changes so the browser always reshapes from scratch —
                      // some engines cache glyph shaping per-node and don't
                      // reliably re-run it on a bare style-attribute update.
                      key={featureValue ?? "default"}
                      onInput={(event) =>
                        setDemoText(tag, event.currentTarget.textContent ?? "")
                      }
                      spellCheck={false}
                      style={{
                        fontFamily: cssFontFamily ?? "inherit",
                        fontFeatureSettings: featureValue ?? undefined,
                        fontSize: 28,
                      }}
                      suppressContentEditableWarning
                    >
                      {demoText}
                    </div>

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
                          label={`Copy ${tag} CSS`}
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

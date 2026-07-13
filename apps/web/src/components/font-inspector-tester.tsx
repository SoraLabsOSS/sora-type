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
import type { OtToHtmlLangEntry } from "@sora-type/font-engine/data/ot-to-html-lang";
import {
  getColorPalettes,
  hasColorPalettes,
} from "@sora-type/font-engine/font-color-palettes";
import type { LanguageSupportResult } from "@sora-type/font-engine/font-language-detection";
import type { FontMetadata } from "@sora-type/font-engine/font-metadata";
import {
  buildVariationSettings,
  getNamedInstances,
} from "@sora-type/font-engine/font-variable-instances";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const DEFAULT_TESTER_TEXT =
  "The quick brown fox jumps over the lazy dog. 0123456789";
const DEFAULT_FONT_SIZE = 32;
const TESTER_PALETTE_CLASS = "sora-tester-palette-preview";

/** The font's own name-table family name is attacker-controlled (a crafted
 * upload); escape it before it goes into a CSS string literal so it can't
 * break out and inject arbitrary rules into the page. An unescaped raw
 * newline (CR/LF/FF) inside a quoted CSS string token terminates the string
 * early per the CSS Syntax spec — escaping just `\` and `"` isn't enough —
 * so strip control characters first. */
function escapeCssString(value: string): string {
  const withoutControlChars = Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return !(code <= 0x1f || code === 0x7f);
    })
    .join("");
  return withoutControlChars.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

type TextAlign = "center" | "justify" | "left" | "right";

interface FontInspectorTesterProps {
  cssFontFamily: string | null;
  font: FontkitFont;
  languageSystems: OtToHtmlLangEntry[];
  languages: LanguageSupportResult[];
  metadata: FontMetadata;
}

interface LanguageAndPaletteRowProps {
  language: string | null;
  languageSystems: OtToHtmlLangEntry[];
  languages: LanguageSupportResult[];
  paletteIndex: number | null;
  palettes: ReturnType<typeof getColorPalettes>;
  setLanguage: (value: string | null) => void;
  setPaletteIndex: (value: number | null) => void;
}

function LanguageAndPaletteRow({
  language,
  languages,
  languageSystems,
  paletteIndex,
  palettes,
  setLanguage,
  setPaletteIndex,
}: LanguageAndPaletteRowProps) {
  const t = useTranslations("inspector.tester");
  // Some languages have multiple orthographies (e.g. distinct scripts) that
  // share the same ISO 639-3 code; since the `lang` attribute only cares
  // about the code, keep just the first entry per code to avoid duplicate
  // option values.
  const uniqueLanguages = useMemo(() => {
    const seen = new Set<string>();
    return languages.filter((lang) => {
      if (seen.has(lang.code)) {
        return false;
      }
      seen.add(lang.code);
      return true;
    });
  }, [languages]);

  // languageSystems uses BCP-47-ish codes/English names from a different
  // registry than the ISO 639-3 codes here, so there's no reliable code-based
  // join — matching by lowercased English name is a reasonable heuristic for
  // an advisory badge, not an exact cross-reference.
  const layoutDeclaredNames = useMemo(
    () => new Set(languageSystems.map((entry) => entry.name.toLowerCase())),
    [languageSystems]
  );
  const hasLayoutDeclared = layoutDeclaredNames.size > 0;

  if (languages.length === 0 && palettes.length === 0) {
    return null;
  }

  return (
    <HStack gap={3}>
      {uniqueLanguages.length > 0 && (
        <Selector
          description={hasLayoutDeclared ? t("languageDescription") : undefined}
          hasClear
          label={t("languageLabel")}
          onChange={setLanguage}
          options={uniqueLanguages.map((lang) => ({
            value: lang.code,
            label: `${lang.name} (${lang.code})`,
            icon: layoutDeclaredNames.has(lang.name.toLowerCase()) ? (
              <Layers size={14} />
            ) : undefined,
          }))}
          placeholder={t("languagePlaceholder")}
          value={language}
        />
      )}
      {palettes.length > 0 && (
        <Selector
          hasClear
          label={t("colorPaletteLabel")}
          onChange={(value) =>
            setPaletteIndex(value === null ? null : Number(value))
          }
          options={palettes.map((p) => ({
            value: String(p.index),
            label: p.name
              ? t("paletteOption", { name: p.name, index: p.index })
              : t("paletteOptionUnnamed", { index: p.index }),
          }))}
          placeholder={t("colorPalettePlaceholder")}
          value={paletteIndex === null ? null : String(paletteIndex)}
        />
      )}
    </HStack>
  );
}

export function FontInspectorTester({
  cssFontFamily,
  font,
  languages,
  languageSystems,
  metadata,
}: FontInspectorTesterProps) {
  const t = useTranslations("inspector.tester");
  const [text, setText] = useState(DEFAULT_TESTER_TEXT);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [language, setLanguage] = useState<string | null>(null);
  const [paletteIndex, setPaletteIndex] = useState<number | null>(null);
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

  const palettes = useMemo(
    () => (hasColorPalettes(font) ? getColorPalettes(font) : []),
    [font]
  );
  const palette = useMemo(
    () => palettes.find((p) => p.index === paletteIndex) ?? null,
    [palettes, paletteIndex]
  );

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
      if ("opsz" in instance.values) {
        setAutoOpticalSizing(false);
      }
    }
  };

  return (
    <VStack gap={4}>
      <Card className="bg-surface" padding={4}>
        <VStack gap={3}>
          <HStack align="center" gap={2} justify="between">
            <Heading className="font-sans" level={3}>
              {t("heading")}
            </Heading>
            <ToggleButtonGroup
              label={t("textAlignment")}
              onChange={(value) => setTextAlign((value as TextAlign) ?? "left")}
              size="sm"
              type="single"
              value={textAlign}
            >
              <ToggleButton label={t("left")} value="left" />
              <ToggleButton label={t("center")} value="center" />
              <ToggleButton label={t("right")} value="right" />
              <ToggleButton label={t("justify")} value="justify" />
            </ToggleButtonGroup>
          </HStack>

          <LanguageAndPaletteRow
            language={language}
            languageSystems={languageSystems}
            languages={languages}
            paletteIndex={paletteIndex}
            palettes={palettes}
            setLanguage={setLanguage}
            setPaletteIndex={setPaletteIndex}
          />

          <VStack gap={2}>
            <HStack
              gap={3}
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Text color="secondary" type="supporting">
                {t("fontSize")}
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
              label={t("fontSize")}
              max={144}
              min={8}
              onChange={setFontSize}
              value={fontSize}
            />
          </VStack>

          {palette && (
            <style>{`@font-palette-values --${TESTER_PALETTE_CLASS} {\n  font-family: "${escapeCssString(metadata.familyName)}";\n  base-palette: ${palette.index};\n}\n.${TESTER_PALETTE_CLASS} {\n  font-palette: --${TESTER_PALETTE_CLASS};\n}`}</style>
          )}
          <textarea
            className={`w-full resize-y rounded-md border border-border bg-body px-4 py-3 text-primary outline-none transition-colors focus-visible:border-accent ${palette ? TESTER_PALETTE_CLASS : ""}`}
            dir="auto"
            lang={language ?? undefined}
            onChange={(event) => setText(event.target.value)}
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
            value={text}
          />
        </VStack>
      </Card>

      {metadata.variationAxes.length > 0 && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={3}>
            <Heading className="font-sans" level={4}>
              {t("variableAxesHeading")}
            </Heading>

            {namedInstances.length > 0 && (
              <Selector
                description={t("instanceDescription", {
                  count: namedInstances.length,
                })}
                hasClear
                label={t("instanceLabel")}
                onChange={selectInstance}
                options={namedInstances.map((instance) => instance.name)}
                value={activeInstanceName}
              />
            )}

            {hasOpticalSize && (
              <Switch
                description={t("autoOpticalSizingDescription")}
                label={t("autoOpticalSizing")}
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
                    {t("generatedCss")}
                  </Text>
                  <IconButton
                    icon={copied ? <Check size={14} /> : <Copy size={14} />}
                    label={t("copyCss")}
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
                  label={t("showInstancePreviews")}
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

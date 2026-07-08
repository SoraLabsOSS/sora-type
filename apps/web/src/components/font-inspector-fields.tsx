import { HStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import type { LanguageSupportResult } from "@sora-type/font-engine/font-language-detection";

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      gap={3}
      style={{ alignItems: "baseline", justifyContent: "space-between" }}
    >
      <Text color="secondary" type="supporting">
        {label}
      </Text>
      <Text
        style={{ maxWidth: "62%", textAlign: "end", wordBreak: "break-word" }}
        type="body"
      >
        {value}
      </Text>
    </HStack>
  );
}

export function summarizeScripts(
  detected: (LanguageSupportResult & { rowKey: string })[],
  t: (key: string, params?: Record<string, string | number | Date>) => string
): string | undefined {
  const scripts = [...new Set(detected.map((lang) => lang.script))].toSorted();
  if (scripts.length === 0) {
    return;
  }
  if (scripts.length <= 6) {
    return scripts.join(", ");
  }
  return `${scripts.slice(0, 6).join(", ")} ${t("summary.moreScripts", { count: scripts.length - 6 })}`;
}

export interface OneLinerSummaryInput {
  featureCount: number;
  isColor: boolean;
  isHinted: boolean;
  isVariable: boolean;
  languageCount: number;
  outlineFormats: string[];
}

/** A FontSummary.vue-style natural-language sentence describing this font. */
export function buildOneLinerSummary(
  {
    featureCount,
    isColor,
    isHinted,
    isVariable,
    languageCount,
    outlineFormats,
  }: OneLinerSummaryInput,
  locale: string,
  t: (key: string, params?: Record<string, string | number | Date>) => string
): string {
  const traits: string[] = [];
  if (isHinted) {
    traits.push(t("summary.hasHinting"));
  }
  if (outlineFormats.length > 0) {
    traits.push(
      t("summary.usesOutlines", { formats: outlineFormats.join(" + ") })
    );
  }
  if (isVariable) {
    traits.push(t("summary.isVariable"));
  }
  if (isColor) {
    traits.push(t("summary.hasColorGlyphs"));
  }
  if (featureCount > 0) {
    traits.push(t("summary.hasFeatures", { count: featureCount }));
  }
  if (languageCount > 0) {
    traits.push(t("summary.supportsLanguages", { count: languageCount }));
  }

  if (traits.length === 0) {
    return "";
  }
  const list = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(traits);
  return t("summary.sentence", { list });
}

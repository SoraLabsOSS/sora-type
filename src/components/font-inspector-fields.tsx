import { HStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import type { LanguageSupportResult } from "@/lib/font-language-detection";

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
  detected: (LanguageSupportResult & { rowKey: string })[]
): string | undefined {
  const scripts = [...new Set(detected.map((lang) => lang.script))].toSorted();
  if (scripts.length === 0) {
    return;
  }
  if (scripts.length <= 6) {
    return scripts.join(", ");
  }
  return `${scripts.slice(0, 6).join(", ")} +${scripts.length - 6} more`;
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
export function buildOneLinerSummary({
  featureCount,
  isColor,
  isHinted,
  isVariable,
  languageCount,
  outlineFormats,
}: OneLinerSummaryInput): string {
  const traits: string[] = [];
  if (isHinted) {
    traits.push("has hinting");
  }
  if (outlineFormats.length > 0) {
    traits.push(`uses ${outlineFormats.join(" + ")} outlines`);
  }
  if (isVariable) {
    traits.push("is a variable font");
  }
  if (isColor) {
    traits.push("has color glyphs");
  }
  if (featureCount > 0) {
    traits.push(
      `has ${featureCount} OpenType feature${featureCount === 1 ? "" : "s"}`
    );
  }
  if (languageCount > 0) {
    traits.push(
      `supports ${languageCount} language${languageCount === 1 ? "" : "s"}`
    );
  }

  if (traits.length === 0) {
    return "";
  }
  if (traits.length === 1) {
    return `This font ${traits[0]}.`;
  }
  const last = traits.at(-1);
  const rest = traits.slice(0, -1);
  return `This font ${rest.join(", ")}, and ${last}.`;
}

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

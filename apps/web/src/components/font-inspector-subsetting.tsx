"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  buildPyftsubsetCommand,
  getUnsupportedCodePoints,
  getUsedCodePoints,
} from "@sora-type/font-engine/font-subsetting";
import { computeUnicodeRanges } from "@sora-type/font-engine/unicode-ranges";
import type { Font as FontkitFont } from "fontkit";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { getEncodedCodePointCount } from "@/components/glyph-grid";

interface FontInspectorSubsettingProps {
  fileName: string;
  font: FontkitFont;
}

const FILE_EXTENSION = /\.[^./]+$/;

function toHex(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase()}`;
}

export function FontInspectorSubsetting({
  fileName,
  font,
}: FontInspectorSubsettingProps) {
  const [text, setText] = useState("");
  const [copiedRanges, setCopiedRanges] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const usedCodePoints = useMemo(() => getUsedCodePoints(text), [text]);
  const unsupportedCodePoints = useMemo(
    () => getUnsupportedCodePoints(usedCodePoints, font),
    [usedCodePoints, font]
  );
  const unicodeRanges = useMemo(
    () => computeUnicodeRanges(usedCodePoints),
    [usedCodePoints]
  );

  const usedCount = usedCodePoints.size;
  const supportedUsedCount = usedCount - unsupportedCodePoints.length;
  const encodedCodePointCount = getEncodedCodePointCount(font);
  const percentUsed =
    encodedCodePointCount > 0
      ? Math.min(100, (supportedUsedCount / encodedCodePointCount) * 100)
      : 0;

  const outputFileName = `${fileName.replace(FILE_EXTENSION, "")}-subset.woff2`;
  const command =
    usedCount > 0
      ? buildPyftsubsetCommand(fileName, outputFileName, unicodeRanges)
      : null;

  const copy = (value: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <VStack gap={4}>
      <Card className="bg-surface" padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            Subsetting
          </Heading>
          <Text color="secondary" type="supporting">
            Paste the actual text your site uses (a page's content, not a sample
            sentence) to see how much of this font you really need, and get a
            ready command to cut the rest.
          </Text>

          <textarea
            className="min-h-32 w-full resize-y rounded-md border border-border bg-body px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus-visible:border-accent"
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your site copy here…"
            spellCheck={false}
            value={text}
          />
          {text.length === 0 && (
            <Text color="secondary" type="supporting">
              Nothing pasted yet — the stats below reflect an empty selection.
            </Text>
          )}
        </VStack>
      </Card>

      <Card className="bg-surface" padding={4}>
        <VStack gap={2}>
          <Text>
            <strong className="tabular-nums">{supportedUsedCount}</strong> of{" "}
            <strong className="tabular-nums">
              {encodedCodePointCount.toLocaleString()}
            </strong>{" "}
            characters used
            {usedCount > 0 && (
              <span className="text-secondary">
                {" "}
                (~{percentUsed.toFixed(1)}% of the font's character set)
              </span>
            )}
          </Text>
          {usedCount > 0 && (
            <Text color="secondary" type="supporting">
              This is a rough estimate — actual file size savings also depend on
              each glyph's outline complexity, hinting, and any layout tables
              (kerning, ligatures) pyftsubset keeps for the glyphs it retains.
            </Text>
          )}
        </VStack>
      </Card>

      {unsupportedCodePoints.length > 0 && (
        <Banner
          description={`This font has no glyph for: ${unsupportedCodePoints
            .slice(0, 20)
            .map((cp) => `"${String.fromCodePoint(cp)}" (${toHex(cp)})`)
            .join(
              ", "
            )}${unsupportedCodePoints.length > 20 ? ", …" : ""}. Those characters will render with a fallback font regardless of subsetting.`}
          status="warning"
          title="Some characters aren't in this font"
        />
      )}

      {command && (
        <Card className="bg-surface" padding={4}>
          <VStack gap={3}>
            <Heading className="font-sans" level={4}>
              unicode-range
            </Heading>
            <HStack
              gap={2}
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-body px-3 py-2 font-mono text-xs">
                {unicodeRanges.join(", ")}
              </pre>
              <IconButton
                icon={copiedRanges ? <Check size={14} /> : <Copy size={14} />}
                label="Copy unicode-range"
                onClick={() => copy(unicodeRanges.join(", "), setCopiedRanges)}
                size="sm"
                variant="ghost"
              />
            </HStack>

            <Heading className="font-sans" level={4}>
              Subset command
            </Heading>
            <Text color="secondary" type="supporting">
              Requires <code>fonttools</code> (
              <code>pip install fonttools brotli</code>) to run locally.
            </Text>
            <HStack
              gap={2}
              style={{
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-body px-3 py-2 font-mono text-xs">
                {command}
              </pre>
              <IconButton
                icon={copiedCommand ? <Check size={14} /> : <Copy size={14} />}
                label="Copy subset command"
                onClick={() => copy(command, setCopiedCommand)}
                size="sm"
                variant="ghost"
              />
            </HStack>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

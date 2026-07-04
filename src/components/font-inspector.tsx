"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import { useCallback, useState } from "react";
import type { LanguageSupportResult } from "@/lib/font-language-detection";
import { reportAllLanguages } from "@/lib/font-language-detection";
import { summarizeSupport } from "@/lib/font-report";

const FILE_EXTENSION = /\.[^./]+$/;

/**
 * Some language codes have multiple orthographies sharing one script (e.g.
 * "deu" has two Latin orthographies), so `code-script` alone can collide as
 * a React key — disambiguate with an occurrence index, same fix as
 * font-compare.ts's makeRowKey.
 */
function withRowKeys(
  results: LanguageSupportResult[]
): (LanguageSupportResult & { rowKey: string })[] {
  const occurrences = new Map<string, number>();
  return results.map((result) => {
    const base = `${result.code}-${result.script}`;
    const count = occurrences.get(base) ?? 0;
    occurrences.set(base, count + 1);
    return { ...result, rowKey: count === 0 ? base : `${base}-${count}` };
  });
}

interface LoadedFont {
  familyName: string;
  fileName: string;
  fullName: string;
  numGlyphs: number;
  style: string;
}

function openFont(buffer: ArrayBuffer): FontkitFont {
  const opened = createFont(Buffer.from(buffer));
  return "fonts" in opened ? opened.fonts[0] : opened;
}

export default function FontInspector() {
  const [file, setFile] = useState<File | null>(null);
  const [loadedFont, setLoadedFont] = useState<LoadedFont | null>(null);
  const [languages, setLanguages] = useState<LanguageSupportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (selected: File | File[] | null) => {
    const next = Array.isArray(selected) ? selected[0] : selected;
    setFile(next ?? null);
    setError(null);

    if (!next) {
      setLoadedFont(null);
      setLanguages([]);
      return;
    }

    setIsLoading(true);
    try {
      const buffer = await next.arrayBuffer();
      const font = openFont(buffer);
      setLoadedFont({
        fileName: next.name,
        fullName: font.fullName,
        familyName: font.familyName,
        style: font.subfamilyName,
        numGlyphs: font.numGlyphs,
      });
      setLanguages(reportAllLanguages(font, buffer));
    } catch (err) {
      setLoadedFont(null);
      setLanguages([]);
      setError(err instanceof Error ? err.message : "Could not parse font");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function handleExportPdf() {
    if (!file) {
      return;
    }
    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append("font", file);
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Export failed");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(FILE_EXTENSION, "")}-report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  const summary = languages.length > 0 ? summarizeSupport(languages) : null;
  const keyedLanguages = withRowKeys(languages);
  const detected = keyedLanguages.filter(
    (l) => l.support === "full" || l.support === "decomposed"
  );
  const positioningIssues = keyedLanguages.filter(
    (l) => l.support === "positioning-failed"
  );

  return (
    <Section padding={6}>
      <VStack
        gap={6}
        style={{ maxWidth: 720, marginInline: "auto", width: "100%" }}
      >
        <VStack gap={1}>
          <Heading level={1} type="display-2">
            sora-type
          </Heading>
          <Text color="secondary" type="body">
            Drag and drop a font file to see what's inside — including
            shaping-verified language support, not just glyph presence.
          </Text>
        </VStack>

        <FileInput
          accept=".ttf,.otf,.woff,.woff2"
          description="OTF, TTF, WOFF, or WOFF2"
          isLoading={isLoading}
          label="Font file"
          mode="dropzone"
          onChange={handleFile}
          status={error ? { type: "error", message: error } : undefined}
          value={file}
        />

        {loadedFont && (
          <VStack gap={2}>
            <Heading level={2}>{loadedFont.fullName}</Heading>
            <Text color="secondary" type="supporting">
              {loadedFont.familyName} · {loadedFont.style} ·{" "}
              {loadedFont.numGlyphs} glyphs
            </Text>
            <HStack gap={2}>
              <Button
                isLoading={isExporting}
                label="Export PDF report"
                onClick={handleExportPdf}
                variant="secondary"
              />
            </HStack>
          </VStack>
        )}

        {summary && (
          <HStack gap={4}>
            <Text type="body">
              <b>{summary.full}</b> full
            </Text>
            <Text type="body">
              <b>{summary.decomposed}</b> decomposed
            </Text>
            <Text type="body">
              <b>{summary.positioningFailed}</b> positioning failed
            </Text>
            <Text type="body">
              <b>{summary.none}</b> unsupported
            </Text>
          </HStack>
        )}

        {positioningIssues.length > 0 && (
          <VStack gap={2}>
            <Heading level={3}>
              Positioning issues found ({positioningIssues.length})
            </Heading>
            <Text color="secondary" type="supporting">
              These languages have every required glyph, but this font's GPOS
              table doesn't correctly position the combining marks — a cmap-only
              checker would incorrectly report them as supported.
            </Text>
            <List hasDividers header="Positioning issues">
              {positioningIssues.map((lang) => (
                <ListItem
                  description={`${lang.script} · ${lang.unpositioned.join(", ")}`}
                  endContent={
                    <Badge label="positioning failed" variant="warning" />
                  }
                  key={lang.rowKey}
                  label={lang.name}
                />
              ))}
            </List>
          </VStack>
        )}

        {detected.length > 0 && (
          <VStack gap={2}>
            <Divider variant="subtle" />
            <Heading level={3}>Detected languages ({detected.length})</Heading>
            <List hasDividers header="Detected languages">
              {detected.map((lang) => (
                <ListItem
                  description={lang.script}
                  endContent={
                    lang.support === "decomposed" ? (
                      <Badge label="via combining marks" variant="info" />
                    ) : undefined
                  }
                  key={lang.rowKey}
                  label={lang.name}
                />
              ))}
            </List>
          </VStack>
        )}
      </VStack>
    </Section>
  );
}

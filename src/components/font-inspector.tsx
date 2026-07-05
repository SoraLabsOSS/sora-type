"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import { useCallback, useEffect, useState } from "react";
import { FontInspectorDetails } from "@/components/font-inspector-details";
import {
  INSPECTOR_FONT_ACCEPT,
  INSPECTOR_FONT_DESCRIPTION,
  INSPECTOR_FONT_LABEL,
} from "@/components/font-inspector-file-input";
import {
  FontDetailsSkeleton,
  FontMetadataSkeleton,
  GlyphGridSkeleton,
  GlyphsHeadingSkeleton,
  LanguageSummarySkeleton,
  LanguagesDetectedSkeleton,
} from "@/components/font-inspector-shell";
import GlyphGrid from "@/components/glyph-grid";
import { SkeletonTransition } from "@/components/ui/skeleton";
import type { LanguageSupportResult } from "@/lib/font-language-detection";
import { reportAllLanguages } from "@/lib/font-language-detection";
import { extractFontMetadata, type FontMetadata } from "@/lib/font-metadata";
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

const PLACEHOLDER_FONT_URL = "/fonts/TS Crude.ttf";
const PLACEHOLDER_FONT_NAME = "TS Crude.ttf";

interface InspectorResultsProps {
  detected: (LanguageSupportResult & { rowKey: string })[];
  font: FontkitFont | null;
  fontMetadata: FontMetadata | null;
  isContentReady: boolean;
  isExporting: boolean;
  isPlaceholder: boolean;
  loadedFont: LoadedFont | null;
  onExportPdf: () => void;
  positioningIssues: (LanguageSupportResult & { rowKey: string })[];
  summary: ReturnType<typeof summarizeSupport> | null;
}

function InspectorResults({
  detected,
  font,
  fontMetadata,
  isContentReady,
  isExporting,
  isPlaceholder,
  loadedFont,
  onExportPdf,
  positioningIssues,
  summary,
}: InspectorResultsProps) {
  const isLoadingContent = !isContentReady;

  return (
    <VStack gap={6}>
      <SkeletonTransition
        loading={isLoadingContent}
        skeleton={<FontMetadataSkeleton />}
      >
        {loadedFont ? (
          <VStack gap={2}>
            {isPlaceholder ? (
              <Text color="secondary" type="supporting">
                Showing an example font — upload your own to inspect it.
              </Text>
            ) : null}
            <Heading className="font-sans" level={2}>
              {loadedFont.fullName}
            </Heading>
            <Text color="secondary" type="supporting">
              {loadedFont.familyName} · {loadedFont.style} ·{" "}
              {loadedFont.numGlyphs} glyphs
            </Text>
            <HStack gap={2}>
              <Button
                isDisabled={isPlaceholder}
                isLoading={isExporting}
                label="Export PDF report"
                onClick={onExportPdf}
                variant="secondary"
              />
            </HStack>
          </VStack>
        ) : null}
      </SkeletonTransition>

      <SkeletonTransition
        loading={isLoadingContent}
        skeleton={<FontDetailsSkeleton />}
      >
        {fontMetadata ? <FontInspectorDetails metadata={fontMetadata} /> : null}
      </SkeletonTransition>

      <VStack gap={2}>
        <Divider variant="subtle" />
        <SkeletonTransition
          loading={isLoadingContent}
          skeleton={
            <VStack gap={2}>
              <GlyphsHeadingSkeleton />
              <Text color="secondary" type="supporting">
                Showing the first 500 glyphs. Hover a cell for its Unicode code
                point.
              </Text>
              <GlyphGridSkeleton />
            </VStack>
          }
        >
          {loadedFont && font ? (
            <VStack gap={2}>
              <Heading className="font-sans" level={3}>
                Glyphs ({loadedFont.numGlyphs})
              </Heading>
              <Text color="secondary" type="supporting">
                Showing the first 500 glyphs. Hover a cell for its Unicode code
                point.
              </Text>
              <GlyphGrid font={font} />
            </VStack>
          ) : null}
        </SkeletonTransition>
      </VStack>

      <SkeletonTransition
        loading={isLoadingContent}
        skeleton={<LanguageSummarySkeleton />}
      >
        {summary ? (
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
        ) : null}
      </SkeletonTransition>

      {isContentReady && positioningIssues.length > 0 ? (
        <VStack gap={2}>
          <Heading className="font-sans" level={3}>
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
      ) : null}

      <VStack gap={2}>
        <Divider variant="subtle" />
        <SkeletonTransition
          loading={isLoadingContent}
          skeleton={<LanguagesDetectedSkeleton />}
        >
          <Collapsible
            defaultIsOpen={false}
            trigger={
              <Text type="body">
                Support for{" "}
                <Text as="span" weight="bold">
                  {detected.length}
                </Text>{" "}
                languages detected
              </Text>
            }
          >
            {detected.length > 0 ? (
              <VStack gap={2}>
                <Text color="secondary" type="supporting">
                  {detected.map((lang, i) => (
                    <span key={lang.rowKey}>
                      {lang.name} ({lang.script}
                      {lang.support === "decomposed" ? "*" : ""})
                      {i < detected.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </Text>
                {detected.some((lang) => lang.support === "decomposed") ? (
                  <Text color="secondary" type="supporting">
                    * supported via combining marks, not a precomposed glyph
                  </Text>
                ) : null}
              </VStack>
            ) : null}
          </Collapsible>
        </SkeletonTransition>
      </VStack>
    </VStack>
  );
}

export default function FontInspector() {
  const [file, setFile] = useState<File | null>(null);
  const [loadedFont, setLoadedFont] = useState<LoadedFont | null>(null);
  const [font, setFont] = useState<FontkitFont | null>(null);
  const [fontMetadata, setFontMetadata] = useState<FontMetadata | null>(null);
  const [languages, setLanguages] = useState<LanguageSupportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isContentReady = Boolean(
    loadedFont && font && fontMetadata && !isBootstrapping && !isLoading
  );

  const loadFontFromBuffer = useCallback(
    (fileName: string, buffer: ArrayBuffer) => {
      const openedFont = openFont(buffer);
      setLoadedFont({
        fileName,
        fullName: openedFont.fullName,
        familyName: openedFont.familyName,
        style: openedFont.subfamilyName,
        numGlyphs: openedFont.numGlyphs,
      });
      setFont(openedFont);
      setFontMetadata(extractFontMetadata(openedFont, fileName));
      setLanguages(reportAllLanguages(openedFont, buffer));
    },
    []
  );

  const loadPlaceholder = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const response = await fetch(PLACEHOLDER_FONT_URL);
      const buffer = await response.arrayBuffer();
      loadFontFromBuffer(PLACEHOLDER_FONT_NAME, buffer);
      setIsPlaceholder(true);
    } catch {
      setLoadedFont(null);
      setFont(null);
      setFontMetadata(null);
      setLanguages([]);
      setIsPlaceholder(false);
    } finally {
      setIsBootstrapping(false);
    }
  }, [loadFontFromBuffer]);

  useEffect(() => {
    loadPlaceholder();
  }, [loadPlaceholder]);

  const handleFile = useCallback(
    async (selected: File | File[] | null) => {
      const next = Array.isArray(selected) ? selected[0] : selected;
      setFile(next ?? null);
      setError(null);

      if (!next) {
        setLoadedFont(null);
        setFont(null);
        setFontMetadata(null);
        setLanguages([]);
        setIsPlaceholder(false);
        await loadPlaceholder();
        return;
      }

      setIsPlaceholder(false);
      setIsLoading(true);
      try {
        const buffer = await next.arrayBuffer();
        loadFontFromBuffer(next.name, buffer);
      } catch (err) {
        setLoadedFont(null);
        setFont(null);
        setFontMetadata(null);
        setLanguages([]);
        setError(err instanceof Error ? err.message : "Could not parse font");
      } finally {
        setIsLoading(false);
      }
    },
    [loadFontFromBuffer, loadPlaceholder]
  );

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
          <Text color="secondary" type="body">
            Drag and drop a font file to see what's inside — including
            shaping-verified language support, not just glyph presence.
          </Text>
        </VStack>

        <FileInput
          accept={INSPECTOR_FONT_ACCEPT}
          description={INSPECTOR_FONT_DESCRIPTION}
          isLoading={isLoading}
          label={INSPECTOR_FONT_LABEL}
          mode="dropzone"
          onChange={handleFile}
          status={error ? { type: "error", message: error } : undefined}
          value={file}
        />

        <InspectorResults
          detected={detected}
          font={font}
          fontMetadata={fontMetadata}
          isContentReady={isContentReady}
          isExporting={isExporting}
          isPlaceholder={isPlaceholder}
          loadedFont={loadedFont}
          onExportPdf={handleExportPdf}
          positioningIssues={positioningIssues}
          summary={summary}
        />
      </VStack>
    </Section>
  );
}

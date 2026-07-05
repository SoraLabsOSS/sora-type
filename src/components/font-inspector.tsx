"use client";

import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FONT_SIZE,
  FontInspectorPreview,
} from "@/components/font-inspector-preview";
import { FontInspectorSidebar } from "@/components/font-inspector-sidebar";
import { FontInspectorSummaryPanel } from "@/components/font-inspector-summary-panel";
import {
  INSPECTOR_FONT_ACCEPT,
  InspectorFontUpload,
} from "@/components/font-inspector-upload";
import GlyphGrid from "@/components/glyph-grid";
import { clearFontFace, loadFontFace, toCssFontFamily } from "@/lib/font-face";
import type { LanguageSupportResult } from "@/lib/font-language-detection";
import { reportAllLanguages } from "@/lib/font-language-detection";
import { extractFontMetadata, type FontMetadata } from "@/lib/font-metadata";
import { summarizeSupport } from "@/lib/font-report";

const FILE_EXTENSION = /\.[^./]+$/;
const INSPECTOR_FONT_SLOT = "inspector";
const GLYPH_CELL_MIN_WIDTH = 64;
const COLUMN_SCROLL_CLASS =
  "scrollbar-hidden min-h-0 lg:h-full lg:overflow-y-auto lg:overscroll-y-contain";

const INSPECTOR_SECTION_CLASS = [
  "flex min-h-0 flex-1 flex-col h-full max-lg:flex-none max-lg:overflow-visible lg:overflow-hidden",
  "[&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col",
].join(" ");

const INSPECTOR_GRID_CLASS =
  "grid grid-cols-1 gap-4 max-lg:min-h-min max-lg:flex-none lg:min-h-0 lg:flex-1 lg:h-full lg:grid-cols-[280px_minmax(0,1fr)_minmax(240px,280px)] lg:overflow-hidden";

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
  fileSizeBytes: number;
  fullName: string;
  numGlyphs: number;
  style: string;
}

function openFont(buffer: ArrayBuffer): FontkitFont {
  const opened = createFont(Buffer.from(buffer));
  return "fonts" in opened ? opened.fonts[0] : opened;
}

const PLACEHOLDER_FONT_URL = "/fonts/8894d4fc112b8f24-s.p.woff2";
const PLACEHOLDER_FONT_NAME = "8894d4fc112b8f24-s.p.woff2";

export default function FontInspector() {
  const [file, setFile] = useState<File | null>(null);
  const [loadedFont, setLoadedFont] = useState<LoadedFont | null>(null);
  const [font, setFont] = useState<FontkitFont | null>(null);
  const [fontBuffer, setFontBuffer] = useState<ArrayBuffer | null>(null);
  const [fontMetadata, setFontMetadata] = useState<FontMetadata | null>(null);
  const [cssFontFamily, setCssFontFamily] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageSupportResult[]>([]);
  const [previewFontSize, setPreviewFontSize] = useState(DEFAULT_FONT_SIZE);
  const [previewText, setPreviewText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFontFromBuffer = useCallback(
    (fileName: string, buffer: ArrayBuffer) => {
      const openedFont = openFont(buffer);
      setLoadedFont({
        fileName,
        fileSizeBytes: buffer.byteLength,
        fullName: openedFont.fullName,
        familyName: openedFont.familyName,
        style: openedFont.subfamilyName,
        numGlyphs: openedFont.numGlyphs,
      });
      setFont(openedFont);
      setFontBuffer(buffer);
      setFontMetadata(extractFontMetadata(openedFont, fileName));
      setLanguages(reportAllLanguages(openedFont, buffer));
    },
    []
  );

  const loadPlaceholder = useCallback(async () => {
    try {
      const response = await fetch(PLACEHOLDER_FONT_URL);
      const buffer = await response.arrayBuffer();
      loadFontFromBuffer(PLACEHOLDER_FONT_NAME, buffer);
      setIsPlaceholder(true);
    } catch {
      setLoadedFont(null);
      setFont(null);
      setFontBuffer(null);
      setFontMetadata(null);
      setLanguages([]);
      setCssFontFamily(null);
      setIsPlaceholder(false);
    }
  }, [loadFontFromBuffer]);

  useEffect(() => {
    loadPlaceholder();
  }, [loadPlaceholder]);

  useEffect(() => {
    if (!(fontBuffer && loadedFont)) {
      setCssFontFamily(null);
      return;
    }

    let cancelled = false;
    const family = toCssFontFamily(INSPECTOR_FONT_SLOT, loadedFont.fileName);

    loadFontFace(INSPECTOR_FONT_SLOT, family, fontBuffer)
      .then(() => {
        if (!cancelled) {
          setCssFontFamily(family);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCssFontFamily(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fontBuffer, loadedFont]);

  useEffect(() => () => clearFontFace(INSPECTOR_FONT_SLOT), []);

  const handleFile = useCallback(
    async (selected: File | File[] | null) => {
      const next = Array.isArray(selected) ? selected[0] : selected;
      setFile(next ?? null);
      setError(null);

      if (!next) {
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
        setFontBuffer(null);
        setFontMetadata(null);
        setLanguages([]);
        setCssFontFamily(null);
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
    (language) =>
      language.support === "full" || language.support === "decomposed"
  );
  const positioningIssues = keyedLanguages.filter(
    (language) => language.support === "positioning-failed"
  );

  return (
    <Section className={INSPECTOR_SECTION_CLASS} padding={4}>
      <div className={INSPECTOR_GRID_CLASS}>
        <aside className={`flex flex-col ${COLUMN_SCROLL_CLASS}`}>
          <FontInspectorSidebar
            detected={detected}
            fontMetadata={fontMetadata}
            isExporting={isExporting}
            isPlaceholder={isPlaceholder}
            loadedFont={loadedFont}
            onExportPdf={handleExportPdf}
          />
        </aside>

        <div className={`flex flex-col gap-4 ${COLUMN_SCROLL_CLASS}`}>
          <InspectorFontUpload
            accept={INSPECTOR_FONT_ACCEPT}
            isLoading={isLoading}
            onChange={handleFile}
            status={error ? { type: "error", message: error } : undefined}
            value={file}
          />

          <div>
            <FontInspectorPreview
              cssFontFamily={cssFontFamily}
              fontSize={previewFontSize}
              onFontSizeChange={setPreviewFontSize}
              onPreviewTextChange={setPreviewText}
              previewText={previewText}
              weightLabel={fontMetadata?.weightLabel}
            />
          </div>

          <Card className="min-w-0 bg-surface" padding={4}>
            <VStack className="min-h-0" gap={3}>
              {loadedFont && font ? (
                <VStack gap={2}>
                  <Heading className="font-sans" level={3}>
                    Glyphs ({loadedFont.numGlyphs.toLocaleString()})
                  </Heading>
                  <Text color="secondary" type="supporting">
                    Showing the first 500 glyphs. Hover a cell for its Unicode
                    code point.
                  </Text>
                  <GlyphGrid cellMinWidth={GLYPH_CELL_MIN_WIDTH} font={font} />
                </VStack>
              ) : null}
            </VStack>
          </Card>
        </div>

        <aside className={`flex flex-col ${COLUMN_SCROLL_CLASS}`}>
          <FontInspectorSummaryPanel
            detected={detected}
            fontMetadata={fontMetadata}
            positioningIssues={positioningIssues}
            summary={summary}
          />
        </aside>
      </div>
    </Section>
  );
}

"use client";

import { Divider } from "@astryxdesign/core/Divider";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import dynamic from "next/dynamic";
import { InspectorFileInputShell } from "@/components/font-inspector-file-input";
import {
  FontDetailsSkeleton,
  FontMetadataSkeleton,
  GlyphGridSkeleton,
  GlyphsHeadingSkeleton,
  LanguageSummarySkeleton,
  LanguagesDetectedSkeleton,
} from "@/components/font-inspector-shell";

function FontInspectorLoadingShell() {
  return (
    <Section padding={6}>
      <VStack
        gap={6}
        style={{ maxWidth: 720, marginInline: "auto", width: "100%" }}
      >
        <Text color="secondary" type="body">
          Drag and drop a font file to see what's inside — including
          shaping-verified language support, not just glyph presence.
        </Text>

        <InspectorFileInputShell isLoading />

        <VStack gap={6}>
          <FontMetadataSkeleton />

          <FontDetailsSkeleton />

          <VStack gap={2}>
            <Divider variant="subtle" />
            <GlyphsHeadingSkeleton />
            <Text color="secondary" type="supporting">
              Showing the first 500 glyphs. Hover a cell for its Unicode code
              point.
            </Text>
            <GlyphGridSkeleton />
          </VStack>

          <LanguageSummarySkeleton />

          <VStack gap={2}>
            <Divider variant="subtle" />
            <LanguagesDetectedSkeleton />
          </VStack>
        </VStack>
      </VStack>
    </Section>
  );
}

// fontkit/harfbuzzjs initialize a WASM module at import time, which breaks
// during SSR of a client component. Deferring the import until the browser
// mounts it avoids that entirely — see src/lib/font-shaping.ts.
const FontInspector = dynamic(() => import("@/components/font-inspector"), {
  ssr: false,
  loading: () => <FontInspectorLoadingShell />,
});

export default function HomePage() {
  return <FontInspector />;
}

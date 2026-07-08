import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { GITHUB_REPO_URL, PORTFOLIO_URL } from "@/lib/site";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <Section
      className="scrollbar-hidden flex min-h-0 flex-1 flex-col px-4 pt-4 pb-10 max-lg:flex-none max-lg:overflow-visible lg:overflow-y-auto lg:overscroll-y-contain lg:px-6 lg:pt-6 lg:pb-14"
      padding={0}
      variant="transparent"
    >
      <VStack className="mx-auto w-full max-w-2xl" gap={6}>
        <VStack gap={1}>
          <Text color="accent" type="supporting">
            🔍 WHAT IS THIS
          </Text>
          <Heading className="font-sans" level={1}>
            A font inspector that runs entirely in your browser
          </Heading>
        </VStack>

        <Text as="p" type="body">
          Sora Type reads OpenType, TrueType, WOFF, and WOFF2 files with fontkit
          and shapes text with harfbuzzjs — both running client-side in
          WebAssembly. Drop in a font and see its metadata, glyph coverage,
          language support, and OpenType layout features, or load two fonts side
          by side to compare them directly.
        </Text>

        <VStack gap={2}>
          <Heading className="font-sans" level={2}>
            Inspector
          </Heading>
          <Text as="p" type="body">
            <b>Metadata &amp; glyphs</b> shows every metric a font carries, plus
            a full glyph grid you can group by Unicode category.{" "}
            <b>Language support</b> checks real shaping behavior, not just
            character coverage — catching marks and combining characters that
            render but don't position correctly. The <b>variable font tester</b>{" "}
            gives you live sliders for every axis, named-instance presets,
            optical sizing, and one-click copy of the resulting{" "}
            <code>font-variation-settings</code> CSS.{" "}
            <b>Layout features &amp; color</b> lets you toggle OpenType features
            on real text, browse alternates, and inspect COLR/CPAL palettes.{" "}
            <b>Raw tables</b> decodes every OpenType table a font defines,
            expandable field by field. And <b>CSS, subsetting &amp; PDF</b>{" "}
            tools generate a ready-to-use stylesheet, estimate subsetting
            savings from your real page copy, or export a full PDF report.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading className="font-sans" level={2}>
            Compare
          </Heading>
          <Text as="p" type="body">
            Load two fonts side by side for <b>text and waterfall</b> reading at
            matched size and line-height, with independent variable-axis sliders
            per font, plus a full <b>glyph and OpenType-feature diff</b>. The{" "}
            <b>glyph overlay</b> superimposes outlines from both fonts with
            baseline, x-height, and cap-height guide lines so you can see shape
            differences directly. Every metric, variable axis, and OpenType
            table gets a <b>side-by-side diff</b>, and{" "}
            <b>pairing diagnostics</b> explain how the two fonts' x-height,
            weight, width, slant, and serif/sans-serif style differ in plain
            language — not a made-up compatibility score, just the facts and
            what they'll look like.
          </Text>
        </VStack>

        <Card className="w-full min-w-0 bg-surface" padding={4}>
          <VStack gap={2}>
            <Text color="accent" type="supporting">
              🛡️ PRIVATE BY DESIGN
            </Text>
            <Text as="p" type="body">
              Your font files never leave your device for inspection or
              comparison. The one exception is PDF export, which needs a
              server-side PDF engine and discards the file immediately after
              rendering.
            </Text>
            <Button
              href="/privacy"
              label="Read the full privacy policy"
              size="sm"
              variant="secondary"
            />
          </VStack>
        </Card>

        <Divider variant="subtle" />

        <HStack align="center" gap={3} justify="between" wrap="wrap">
          <Text color="secondary" type="supporting">
            Crafted by Axyl · open source
          </Text>
          <HStack gap={2}>
            <Button
              href={PORTFOLIO_URL}
              label="Portfolio"
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
            />
            <Button
              href={GITHUB_REPO_URL}
              label="Source code"
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
            />
            <Button
              href={`${GITHUB_REPO_URL}/issues`}
              label="Report an issue"
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
            />
          </HStack>
        </HStack>
      </VStack>
    </Section>
  );
}

import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <Section
      className="flex min-h-0 flex-1 justify-center overflow-y-auto px-4 py-4 lg:px-6 lg:py-6"
      padding={0}
      variant="transparent"
    >
      <Card className="w-full min-w-0 max-w-2xl bg-surface [--astryx-card-padding:var(--spacing-4)] lg:[--astryx-card-padding:var(--spacing-6)]">
        <VStack className="w-full min-w-0" gap={4}>
          <VStack gap={1}>
            <Text color="accent" type="supporting">
              🛡️ PRIVATE BY DESIGN
            </Text>
            <Heading className="font-sans" level={1}>
              Your fonts never leave your browser
            </Heading>
          </VStack>

          <Text type="body">
            Sora Type parses, previews, and inspects every font entirely on your
            device. Font files are read with fontkit and shaped with harfbuzzjs,
            both running client-side in WebAssembly — nothing is sent to a
            server for inspection, comparison, or preview.
          </Text>

          <Text type="body">
            This matters if you work with commercial or NDA-protected typefaces:
            you can drop them in and inspect metadata, glyph coverage, and
            language support without any file ever touching our infrastructure.
          </Text>

          <VStack gap={1}>
            <Heading className="font-sans" level={3}>
              The one exception: PDF export
            </Heading>
            <Text color="secondary" type="body">
              Generating a PDF report requires a Node.js PDF engine, which can't
              run in the browser. When you use "Export PDF report", your font
              file is sent once to our server to render the report, then
              discarded immediately after the response is returned — it is never
              logged, stored, or reused.
            </Text>
          </VStack>
        </VStack>
      </Card>
    </Section>
  );
}

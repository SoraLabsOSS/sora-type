import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("privacy.meta");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <Section
      className="scrollbar-hidden flex min-h-0 flex-1 flex-col justify-center px-4 py-4 max-lg:flex-none max-lg:overflow-visible lg:overflow-y-auto lg:overscroll-y-contain lg:px-6 lg:py-6"
      padding={0}
      variant="transparent"
    >
      <Card className="mx-auto w-full min-w-0 max-w-2xl bg-surface [--astryx-card-padding:var(--spacing-4)] lg:[--astryx-card-padding:var(--spacing-6)]">
        <VStack className="w-full min-w-0" gap={4}>
          <VStack gap={1}>
            <Text color="accent" type="supporting">
              {t("eyebrow")}
            </Text>
            <Heading className="font-sans" level={1}>
              {t("heading")}
            </Heading>
          </VStack>

          <Text type="body">{t("body1")}</Text>

          <Text type="body">{t("body2")}</Text>

          <VStack gap={1}>
            <Heading className="font-sans" level={3}>
              {t("extension.heading")}
            </Heading>
            <Text color="secondary" type="body">
              {t("extension.body1")}
            </Text>
            <Text color="secondary" type="body">
              {t("extension.body2")}
            </Text>
            <Text color="secondary" type="body">
              {t("extension.body3")}
            </Text>
            <Text color="secondary" type="body">
              {t("extension.body4")}
            </Text>
          </VStack>

          <VStack gap={1}>
            <Heading className="font-sans" level={3}>
              {t("pdfException.heading")}
            </Heading>
            <Text color="secondary" type="body">
              {t("pdfException.body")}
            </Text>
          </VStack>
        </VStack>
      </Card>
    </Section>
  );
}

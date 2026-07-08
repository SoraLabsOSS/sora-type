import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { getTranslations } from "next-intl/server";
import { GITHUB_REPO_URL, PORTFOLIO_URL } from "@/lib/site";

export async function generateMetadata() {
  const t = await getTranslations("about.meta");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const richTags = { b: (chunks: React.ReactNode) => <b>{chunks}</b> };

  return (
    <Section
      className="scrollbar-hidden flex min-h-0 flex-1 flex-col px-4 pt-4 pb-10 max-lg:flex-none max-lg:overflow-visible lg:overflow-y-auto lg:overscroll-y-contain lg:px-6 lg:pt-6 lg:pb-14"
      padding={0}
      variant="transparent"
    >
      <VStack className="mx-auto w-full max-w-2xl" gap={6}>
        <VStack gap={1}>
          <Text color="accent" type="supporting">
            {t("hero.eyebrow")}
          </Text>
          <Heading className="font-sans" level={1}>
            {t("hero.heading")}
          </Heading>
        </VStack>

        <Text as="p" type="body">
          {t("intro")}
        </Text>

        <VStack gap={2}>
          <Heading className="font-sans" level={2}>
            {t("inspector.heading")}
          </Heading>
          <Text as="p" type="body">
            {t.rich("inspector.body", {
              ...richTags,
              code: (chunks: React.ReactNode) => <code>{chunks}</code>,
            })}
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading className="font-sans" level={2}>
            {t("compare.heading")}
          </Heading>
          <Text as="p" type="body">
            {t.rich("compare.body", richTags)}
          </Text>
        </VStack>

        <Card className="w-full min-w-0 bg-surface" padding={4}>
          <VStack gap={2}>
            <Text color="accent" type="supporting">
              {t("privateByDesign.eyebrow")}
            </Text>
            <Text as="p" type="body">
              {t("privateByDesign.body")}
            </Text>
            <Button
              href="/privacy"
              label={t("privateByDesign.readPolicy")}
              size="sm"
              variant="secondary"
            />
          </VStack>
        </Card>

        <Divider variant="subtle" />

        <HStack align="center" gap={3} justify="between" wrap="wrap">
          <Text color="secondary" type="supporting">
            {t("footer.credit")}
          </Text>
          <HStack gap={2}>
            <Button
              href={PORTFOLIO_URL}
              label={t("footer.portfolio")}
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
            />
            <Button
              href={GITHUB_REPO_URL}
              label={t("footer.sourceCode")}
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
            />
            <Button
              href={`${GITHUB_REPO_URL}/issues`}
              label={t("footer.reportIssue")}
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

import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";

const NOT_FOUND_SECTION_CLASS = [
  "flex h-full min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 lg:px-6 lg:py-6",
  "[&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col [&>div]:items-center [&>div]:justify-center",
].join(" ");

export default function NotFound() {
  return (
    <Section
      className={NOT_FOUND_SECTION_CLASS}
      padding={0}
      variant="transparent"
    >
      <VStack className="text-center" gap={4} hAlign="center">
        <Heading
          className="font-heading font-normal text-8xl leading-none tracking-tight"
          level={1}
        >
          404
        </Heading>
        <Text color="secondary" type="body">
          This page could not be found.
        </Text>
        <Button href="/" label="Back to Home" variant="primary" />
      </VStack>
    </Section>
  );
}

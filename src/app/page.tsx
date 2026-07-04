"use client";

import { Center } from "@astryxdesign/core/Center";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-body">
      <Section padding={6} variant="transparent">
        <Center>
          <VStack className="max-w-[560px] text-center" gap={4} hAlign="center">
            <Text color="accent" type="display-2">
              hello world
            </Text>
          </VStack>
        </Center>
      </Section>
    </div>
  );
}

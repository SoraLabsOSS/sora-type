"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { Font as FontkitFont } from "fontkit";
import { useMemo } from "react";
import { getColorFormats, getColorPalettes } from "@/lib/font-color-palettes";

interface FontInspectorColorProps {
  font: FontkitFont;
}

export function FontInspectorColor({ font }: FontInspectorColorProps) {
  const colorFormats = useMemo(() => getColorFormats(font), [font]);
  const palettes = useMemo(() => getColorPalettes(font), [font]);

  return (
    <VStack gap={4}>
      <Card className="bg-surface" padding={4}>
        <VStack gap={3}>
          <Heading className="font-sans" level={3}>
            Color
          </Heading>
          {colorFormats.length > 0 ? (
            <Text color="secondary" type="supporting">
              This font uses {colorFormats.join(", ")} for color glyphs.
            </Text>
          ) : (
            <Text color="secondary" type="supporting">
              This font has no color glyphs.
            </Text>
          )}
          {colorFormats.length > 0 && palettes.length === 0 && (
            <Banner
              description="Colors are hardcoded directly in the font's glyphs (no palette to customize)."
              status="warning"
              title="No color palette"
            />
          )}
        </VStack>
      </Card>

      {palettes.map((palette) => (
        <Card className="bg-surface" key={palette.index} padding={4}>
          <VStack gap={3}>
            <Heading className="font-sans" level={4}>
              Palette {palette.index}
              {palette.name ? ` — ${palette.name}` : ""}
            </Heading>
            <HStack gap={2} style={{ flexWrap: "wrap" }}>
              {palette.colors.map((color, colorIndex) => (
                <VStack
                  gap={1}
                  // biome-ignore lint/suspicious/noArrayIndexKey: color entries have no stable identity beyond position
                  key={colorIndex}
                  style={{ alignItems: "center", width: 72 }}
                >
                  <div
                    className="rounded-md border border-border"
                    style={{ backgroundColor: color, height: 32, width: 32 }}
                  />
                  <Text
                    className="text-center"
                    color="secondary"
                    type="supporting"
                  >
                    {color}
                  </Text>
                </VStack>
              ))}
            </HStack>
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}

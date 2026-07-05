"use client";

import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Slider } from "@astryxdesign/core/Slider";
import { Switch } from "@astryxdesign/core/Switch";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import { useCallback, useMemo, useState } from "react";
import { buildComparisonMatrix } from "@/lib/font-compare";
import { clearFontFace, loadFontFace, toCssFontFamily } from "@/lib/font-face";

type Slot = "left" | "right";
type TabValue = "text" | "waterfall" | "characters" | "data" | "about";

interface SlotMeta {
  familyName: string;
  fileName: string;
  fullName: string;
  numGlyphs: number;
  style: string;
}

interface FontSlotState {
  buffer: ArrayBuffer | null;
  cssFontFamily: string | null;
  error: string | null;
  file: File | null;
  font: FontkitFont | null;
  isLoading: boolean;
  meta: SlotMeta | null;
}

const EMPTY_SLOT: FontSlotState = {
  file: null,
  font: null,
  buffer: null,
  cssFontFamily: null,
  meta: null,
  isLoading: false,
  error: null,
};

const DEFAULT_FONT_SIZE = 14;
const DEFAULT_LINE_HEIGHT = 1.5;
const COMPARE_GRID_COLUMNS = { minWidth: 320, max: 2 } as const;
const SAMPLE_TEXT =
  "Traditionally, text is composed to create a readable, coherent, and visually satisfying typeface that works invisibly, without the awareness of the reader. Even distribution of typeset material, with a minimum of distractions and anomalies, is aimed at producing clarity and transparency.";

const TABS: { label: string; value: TabValue }[] = [
  { value: "text", label: "Text" },
  { value: "waterfall", label: "Waterfall" },
  { value: "characters", label: "Characters" },
  { value: "data", label: "Data" },
  { value: "about", label: "About Compare" },
];

function openFont(buffer: ArrayBuffer): FontkitFont {
  const opened = createFont(Buffer.from(buffer));
  return "fonts" in opened ? opened.fonts[0] : opened;
}

function isSlotReady(state: FontSlotState): boolean {
  return Boolean(state.font && state.meta && state.cssFontFamily);
}

function FontDropzone({
  onChange,
  slot,
  state,
}: {
  onChange: (slot: Slot, file: File | File[] | null) => void;
  slot: Slot;
  state: FontSlotState;
}) {
  return (
    <FileInput
      accept=".ttf,.otf,.woff,.woff2"
      description="OTF, TTF, WOFF, or WOFF2"
      isLoading={state.isLoading}
      label={slot === "left" ? "First font" : "Second font"}
      mode="dropzone"
      onChange={(file) => onChange(slot, file)}
      placeholder={
        slot === "left"
          ? "Drop one font here, or choose a file"
          : "Drop another font here, or choose a file"
      }
      status={state.error ? { type: "error", message: state.error } : undefined}
      value={state.file}
    />
  );
}

function CompareEmptyPanel() {
  return (
    <Card minHeight={192} padding={4}>
      <Center>
        <Text color="secondary" type="body">
          Drop fonts above to compare them side by side.
        </Text>
      </Center>
    </Card>
  );
}

function ComparisonColumn({
  fontSize,
  lineHeight,
  normalLineHeight,
  onFontSizeChange,
  onLineHeightChange,
  slot,
  state,
}: {
  fontSize: number;
  lineHeight: number;
  normalLineHeight: boolean;
  onFontSizeChange: (slot: Slot, value: number) => void;
  onLineHeightChange: (slot: Slot, value: number) => void;
  slot: Slot;
  state: FontSlotState;
}) {
  if (!(state.font && state.meta && state.cssFontFamily)) {
    return (
      <Card height="100%" minHeight={240} padding={4}>
        <Text color="secondary" type="supporting">
          {slot === "left" ? "First" : "Second"} font not loaded yet.
        </Text>
      </Card>
    );
  }

  return (
    <Card height="100%" minHeight={240} padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Heading className="font-sans" level={3}>
            {state.meta.fullName}
          </Heading>
          <Text color="secondary" type="supporting">
            {state.meta.familyName} · {state.meta.style}
          </Text>
        </VStack>

        <VStack gap={2}>
          <Slider
            formatValue={(v) => `${v}px`}
            label="Font size"
            max={72}
            min={8}
            onChange={(v: number) => onFontSizeChange(slot, v)}
            value={fontSize}
          />
          <Slider
            disabledMessage="Line-height is set to CSS 'normal'"
            formatValue={(v) => v.toFixed(1)}
            isDisabled={normalLineHeight}
            label="Line height"
            max={3}
            min={1}
            onChange={(v: number) => onLineHeightChange(slot, v)}
            step={0.1}
            value={lineHeight}
          />
        </VStack>

        <Divider variant="subtle" />

        <VStack gap={2}>
          <Text color="secondary" type="supporting">
            {fontSize}px / {normalLineHeight ? "normal" : lineHeight.toFixed(1)}
          </Text>
          <Text
            as="p"
            style={{
              fontFamily: state.cssFontFamily,
              fontSize,
              lineHeight: normalLineHeight ? "normal" : lineHeight,
            }}
            type="body"
          >
            {SAMPLE_TEXT}
          </Text>
        </VStack>
      </VStack>
    </Card>
  );
}

export default function CompareView() {
  const [slots, setSlots] = useState<Record<Slot, FontSlotState>>({
    left: EMPTY_SLOT,
    right: EMPTY_SLOT,
  });
  const [activeTab, setActiveTab] = useState<TabValue>("text");
  const [leftSize, setLeftSize] = useState(DEFAULT_FONT_SIZE);
  const [rightSize, setRightSize] = useState(DEFAULT_FONT_SIZE);
  const [leftLineHeight, setLeftLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const [rightLineHeight, setRightLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const [syncSliders, setSyncSliders] = useState(false);
  const [normalLineHeight, setNormalLineHeight] = useState(false);

  const updateSlot = useCallback(
    (slot: Slot, patch: Partial<FontSlotState>) => {
      setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
    },
    []
  );

  const handleFile = useCallback(
    async (slot: Slot, selected: File | File[] | null) => {
      const next = Array.isArray(selected) ? selected[0] : selected;
      if (!next) {
        clearFontFace(slot);
        updateSlot(slot, { ...EMPTY_SLOT });
        return;
      }

      updateSlot(slot, { isLoading: true, error: null });
      try {
        const buffer = await next.arrayBuffer();
        const font = openFont(buffer);
        const cssFontFamily = toCssFontFamily(slot, next.name);
        await loadFontFace(cssFontFamily, cssFontFamily, buffer);
        updateSlot(slot, {
          file: next,
          font,
          buffer,
          cssFontFamily,
          meta: {
            fileName: next.name,
            fullName: font.fullName,
            familyName: font.familyName,
            style: font.subfamilyName,
            numGlyphs: font.numGlyphs,
          },
          isLoading: false,
        });
      } catch (err) {
        updateSlot(slot, {
          ...EMPTY_SLOT,
          error: err instanceof Error ? err.message : "Could not parse font",
        });
      }
    },
    [updateSlot]
  );

  const handleFontSizeChange = useCallback(
    (slot: Slot, value: number) => {
      if (slot === "left") {
        setLeftSize(value);
        if (syncSliders) {
          setRightSize(value);
        }
      } else {
        setRightSize(value);
        if (syncSliders) {
          setLeftSize(value);
        }
      }
    },
    [syncSliders]
  );

  const handleLineHeightChange = useCallback(
    (slot: Slot, value: number) => {
      if (slot === "left") {
        setLeftLineHeight(value);
        if (syncSliders) {
          setRightLineHeight(value);
        }
      } else {
        setRightLineHeight(value);
        if (syncSliders) {
          setLeftLineHeight(value);
        }
      }
    },
    [syncSliders]
  );

  const commonScripts = useMemo(() => {
    if (!(slots.left.font && slots.right.font)) {
      return [];
    }
    const matrix = buildComparisonMatrix([
      {
        id: "left",
        fullName: slots.left.meta?.fullName ?? "Left",
        font: slots.left.font,
        fontData: slots.left.buffer ?? undefined,
      },
      {
        id: "right",
        fullName: slots.right.meta?.fullName ?? "Right",
        font: slots.right.font,
        fontData: slots.right.buffer ?? undefined,
      },
    ]);

    const scripts = new Set<string>();
    for (const row of matrix.languages) {
      const leftCell = matrix.cells.left[row.key];
      const rightCell = matrix.cells.right[row.key];
      const leftOk =
        leftCell?.support === "full" || leftCell?.support === "decomposed";
      const rightOk =
        rightCell?.support === "full" || rightCell?.support === "decomposed";
      if (leftOk && rightOk) {
        scripts.add(row.script);
      }
    }
    return [...scripts].sort();
  }, [slots.left, slots.right]);

  const leftReady = isSlotReady(slots.left);
  const rightReady = isSlotReady(slots.right);
  const canPreview = leftReady || rightReady;

  return (
    <Section padding={6}>
      <VStack gap={6} style={{ width: "100%" }}>
        <VStack gap={1}>
          <Heading className="font-sans" level={1}>
            Compare
          </Heading>
          <Text color="secondary" type="body">
            Drop two fonts to preview sample text side by side and see which
            scripts both support.
          </Text>
        </VStack>

        <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
          <GridSpan columns={1}>
            <FontDropzone
              onChange={handleFile}
              slot="left"
              state={slots.left}
            />
          </GridSpan>
          <GridSpan columns={1}>
            <FontDropzone
              onChange={handleFile}
              slot="right"
              state={slots.right}
            />
          </GridSpan>
        </Grid>

        <Divider variant="subtle" />

        <VStack gap={3}>
          <TabList
            onChange={(v) => setActiveTab(v as TabValue)}
            value={activeTab}
          >
            {TABS.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </TabList>

          {commonScripts.length > 0 ? (
            <HStack gap={2} wrap="wrap">
              {commonScripts.map((script) => (
                <Token key={script} label={script} />
              ))}
            </HStack>
          ) : null}
        </VStack>

        {activeTab === "text" ? (
          <VStack gap={4}>
            {canPreview ? (
              <Card padding={4}>
                <HStack gap={6} wrap="wrap">
                  <Switch
                    label="Synchronize font size and line height"
                    onChange={setSyncSliders}
                    value={syncSliders}
                  />
                  <Switch
                    label="Set CSS 'line-height: normal'"
                    onChange={setNormalLineHeight}
                    value={normalLineHeight}
                  />
                </HStack>
              </Card>
            ) : null}

            {canPreview ? (
              <Grid columns={COMPARE_GRID_COLUMNS} gap={4}>
                <GridSpan columns={1}>
                  <ComparisonColumn
                    fontSize={leftSize}
                    lineHeight={leftLineHeight}
                    normalLineHeight={normalLineHeight}
                    onFontSizeChange={handleFontSizeChange}
                    onLineHeightChange={handleLineHeightChange}
                    slot="left"
                    state={slots.left}
                  />
                </GridSpan>
                <GridSpan columns={1}>
                  <ComparisonColumn
                    fontSize={rightSize}
                    lineHeight={rightLineHeight}
                    normalLineHeight={normalLineHeight}
                    onFontSizeChange={handleFontSizeChange}
                    onLineHeightChange={handleLineHeightChange}
                    slot="right"
                    state={slots.right}
                  />
                </GridSpan>
              </Grid>
            ) : (
              <CompareEmptyPanel />
            )}
          </VStack>
        ) : (
          <Text color="secondary" type="body">
            Coming soon.
          </Text>
        )}
      </VStack>
    </Section>
  );
}

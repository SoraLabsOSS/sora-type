"use client";

import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Section } from "@astryxdesign/core/Section";
import { Slider } from "@astryxdesign/core/Slider";
import { Switch } from "@astryxdesign/core/Switch";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { buildComparisonMatrix } from "@sora-type/font-engine/font-compare";
import {
  clearFontFace,
  loadFontFace,
  toCssFontFamily,
} from "@sora-type/font-engine/font-face";
import {
  extractFontMetadata,
  type FontMetadata,
} from "@sora-type/font-engine/font-metadata";
import { buildVariationSettings } from "@sora-type/font-engine/font-variable-instances";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CompareCharacters } from "@/components/compare-characters";
import { CompareCss } from "@/components/compare-css";
import { CompareData } from "@/components/compare-data";
import { CompareFeatures } from "@/components/compare-features";
import { CompareOverlay } from "@/components/compare-overlay";
import { ComparePairing } from "@/components/compare-pairing";
import { CompareWaterfall } from "@/components/compare-waterfall";
import { InspectorLocalFontPicker } from "@/components/font-inspector-local-font-picker";

type Slot = "left" | "right";
type TabValue =
  | "text"
  | "waterfall"
  | "characters"
  | "features"
  | "css"
  | "overlay"
  | "data"
  | "pairing"
  | "about";

interface SlotMeta {
  familyName: string;
  fileName: string;
  fullName: string;
  numGlyphs: number;
  style: string;
}

export interface FontSlotState {
  buffer: ArrayBuffer | null;
  cssFontFamily: string | null;
  error: string | null;
  file: File | null;
  font: FontkitFont | null;
  isLoading: boolean;
  meta: SlotMeta | null;
}

export interface CompareFontSlot {
  cssFontFamily: string | null;
  fileName: string;
  font: FontkitFont;
  metadata: FontMetadata;
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
// Grid's minWidth math can force a track wider than the viewport on narrow
// screens (min > computed max collapses to a fixed 320px track). Overriding
// with CSS min() keeps the same 1-or-2-column behavior without ever
// exceeding the container width.
const COMPARE_GRID_STYLE = {
  gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
} as const;
const COMPARE_SECTION_CLASS = [
  "flex min-h-0 flex-1 flex-col",
  "max-lg:flex-none max-lg:overflow-visible",
  "scrollbar-hidden lg:overflow-y-auto lg:overscroll-y-contain",
].join(" ");
const SAMPLE_TEXT =
  "Traditionally, text is composed to create a readable, coherent, and visually satisfying typeface that works invisibly, without the awareness of the reader. Even distribution of typeset material, with a minimum of distractions and anomalies, is aimed at producing clarity and transparency.";

const TAB_VALUES: TabValue[] = [
  "text",
  "waterfall",
  "characters",
  "features",
  "css",
  "overlay",
  "data",
  "pairing",
  "about",
];

function openFont(buffer: ArrayBuffer): FontkitFont {
  const opened = createFont(Buffer.from(buffer));
  return "fonts" in opened ? opened.fonts[0] : opened;
}

function buildFontSlot(
  font: FontkitFont | null,
  metadata: FontMetadata | null,
  fileName: string | undefined,
  cssFontFamily: string | null
): CompareFontSlot | null {
  return font && metadata
    ? { font, metadata, fileName: fileName ?? "", cssFontFamily }
    : null;
}

function isSlotReady(state: FontSlotState): boolean {
  return Boolean(state.font && state.meta && state.cssFontFamily);
}

function CompareFontInput({
  localFontPickerKey,
  onChange,
  onLocalFontClear,
  onLocalFontSelect,
  slot,
  state,
}: {
  localFontPickerKey: number;
  onChange: (slot: Slot, file: File | File[] | null) => void;
  onLocalFontClear: (slot: Slot) => void;
  onLocalFontSelect: (
    slot: Slot,
    fileName: string,
    buffer: ArrayBuffer
  ) => void;
  slot: Slot;
  state: FontSlotState;
}) {
  const t = useTranslations("compare");

  return (
    <VStack gap={2}>
      <FileInput
        accept=".ttf,.otf,.woff,.woff2"
        description={t("fontInput.description")}
        isLoading={state.isLoading}
        label={slot === "left" ? t("fontInput.first") : t("fontInput.second")}
        mode="dropzone"
        onChange={(file) => onChange(slot, file)}
        placeholder={
          slot === "left"
            ? t("fontInput.placeholderFirst")
            : t("fontInput.placeholderSecond")
        }
        status={
          state.error ? { type: "error", message: state.error } : undefined
        }
        value={state.file}
      />
      <InspectorLocalFontPicker
        isDisabled={state.isLoading}
        key={localFontPickerKey}
        onClear={() => onLocalFontClear(slot)}
        onSelect={(fileName, buffer) =>
          onLocalFontSelect(slot, fileName, buffer)
        }
      />
    </VStack>
  );
}

function CompareEmptyPanel() {
  const t = useTranslations("compare");
  return (
    <Card minHeight={192} padding={4}>
      <Center>
        <Text color="secondary" type="body">
          {t("emptyPanel")}
        </Text>
      </Center>
    </Card>
  );
}

function ComparisonColumnAxes({
  axisValues,
  metadata,
  onAxisChange,
}: {
  axisValues: Record<string, number>;
  metadata: FontMetadata;
  onAxisChange: (tag: string, value: number) => void;
}) {
  const t = useTranslations("compare");

  if (metadata.variationAxes.length === 0) {
    return null;
  }

  return (
    <>
      <Divider variant="subtle" />
      <VStack gap={3}>
        <Text color="secondary" type="supporting">
          {t("axes.heading")}
        </Text>
        {metadata.variationAxes.map((axis) => (
          <VStack gap={1} key={axis.tag}>
            <HStack
              gap={3}
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Text color="secondary" type="supporting">
                {axis.name} ({axis.tag})
              </Text>
              <NumberInput
                isLabelHidden
                label={axis.name}
                max={axis.max}
                min={axis.min}
                onChange={(value) =>
                  value !== null && onAxisChange(axis.tag, value)
                }
                step={axis.max - axis.min <= 1 ? 0.01 : 1}
                value={axisValues[axis.tag] ?? axis.default}
                width={96}
              />
            </HStack>
            <Slider
              formatValue={(value) => String(value)}
              isLabelHidden
              label={axis.name}
              max={axis.max}
              min={axis.min}
              onChange={(value: number) => onAxisChange(axis.tag, value)}
              step={axis.max - axis.min <= 1 ? 0.01 : 1}
              value={axisValues[axis.tag] ?? axis.default}
            />
          </VStack>
        ))}
      </VStack>
    </>
  );
}

function ComparisonColumn({
  axisValues,
  fontSize,
  lineHeight,
  metadata,
  normalLineHeight,
  onAxisChange,
  onFontSizeChange,
  onLineHeightChange,
  slot,
  state,
  text,
}: {
  axisValues: Record<string, number>;
  fontSize: number;
  lineHeight: number;
  metadata: FontMetadata | null;
  normalLineHeight: boolean;
  onAxisChange: (slot: Slot, tag: string, value: number) => void;
  onFontSizeChange: (slot: Slot, value: number) => void;
  onLineHeightChange: (slot: Slot, value: number) => void;
  slot: Slot;
  state: FontSlotState;
  text: string;
}) {
  const t = useTranslations("compare");

  if (!(state.font && state.meta && state.cssFontFamily && metadata)) {
    return (
      <Card height="100%" minHeight={240} padding={4}>
        <Text color="secondary" type="supporting">
          {slot === "left" ? t("notLoaded.first") : t("notLoaded.second")}
        </Text>
      </Card>
    );
  }

  const variationSettings = buildVariationSettings(axisValues);

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
            label={t("fontSize")}
            max={72}
            min={8}
            onChange={(v: number) => onFontSizeChange(slot, v)}
            value={fontSize}
          />
          <Slider
            disabledMessage={t("lineHeightDisabledMessage")}
            formatValue={(v) => v.toFixed(1)}
            isDisabled={normalLineHeight}
            label={t("lineHeight")}
            max={3}
            min={1}
            onChange={(v: number) => onLineHeightChange(slot, v)}
            step={0.1}
            value={lineHeight}
          />
        </VStack>

        <ComparisonColumnAxes
          axisValues={axisValues}
          metadata={metadata}
          onAxisChange={(tag, value) => onAxisChange(slot, tag, value)}
        />

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
              fontVariationSettings: variationSettings || undefined,
              lineHeight: normalLineHeight ? "normal" : lineHeight,
            }}
            type="body"
          >
            {text}
          </Text>
        </VStack>
      </VStack>
    </Card>
  );
}

export default function CompareView() {
  const t = useTranslations("compare");
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
  const [customText, setCustomText] = useState("");
  const [axisValues, setAxisValues] = useState<
    Record<Slot, Record<string, number>>
  >({ left: {}, right: {} });

  const handleAxisChange = useCallback(
    (slot: Slot, tag: string, value: number) => {
      setAxisValues((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], [tag]: value },
      }));
    },
    []
  );
  const [localFontPickerKeys, setLocalFontPickerKeys] = useState<
    Record<Slot, number>
  >({ left: 0, right: 0 });

  const bumpLocalFontPickerKey = useCallback((slot: Slot) => {
    setLocalFontPickerKeys((prev) => ({ ...prev, [slot]: prev[slot] + 1 }));
  }, []);

  const updateSlot = useCallback(
    (slot: Slot, patch: Partial<FontSlotState>) => {
      setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
    },
    []
  );

  // Guards against out-of-order async resolution: dropping a second file
  // into the same slot before the first has finished parsing could
  // otherwise let the stale first result overwrite the newer one.
  const loadTokens = useRef<Record<Slot, number>>({ left: 0, right: 0 });

  const loadFontIntoSlot = useCallback(
    async (
      slot: Slot,
      fileName: string,
      buffer: ArrayBuffer,
      file: File | null
    ) => {
      const token = ++loadTokens.current[slot];
      updateSlot(slot, { isLoading: true, error: null });
      try {
        const font = openFont(buffer);
        const cssFontFamily = toCssFontFamily(slot, fileName);
        await loadFontFace(cssFontFamily, cssFontFamily, buffer);
        if (loadTokens.current[slot] !== token) {
          return;
        }
        updateSlot(slot, {
          file,
          font,
          buffer,
          cssFontFamily,
          meta: {
            fileName,
            fullName: font.fullName,
            familyName: font.familyName,
            style: font.subfamilyName,
            numGlyphs: font.numGlyphs,
          },
          isLoading: false,
        });
      } catch (err) {
        if (loadTokens.current[slot] !== token) {
          return;
        }
        updateSlot(slot, {
          ...EMPTY_SLOT,
          error: err instanceof Error ? err.message : "Could not parse font",
        });
      }
    },
    [updateSlot]
  );

  const handleFile = useCallback(
    async (slot: Slot, selected: File | File[] | null) => {
      const next = Array.isArray(selected) ? selected[0] : selected;
      bumpLocalFontPickerKey(slot);

      if (!next) {
        loadTokens.current[slot]++;
        clearFontFace(slot);
        updateSlot(slot, { ...EMPTY_SLOT });
        return;
      }

      const buffer = await next.arrayBuffer();
      await loadFontIntoSlot(slot, next.name, buffer, next);
    },
    [bumpLocalFontPickerKey, loadFontIntoSlot, updateSlot]
  );

  const handleLocalFont = useCallback(
    (slot: Slot, fileName: string, buffer: ArrayBuffer) => {
      loadFontIntoSlot(slot, fileName, buffer, null);
    },
    [loadFontIntoSlot]
  );

  const handleLocalFontClear = useCallback(
    (slot: Slot) => {
      loadTokens.current[slot]++;
      clearFontFace(slot);
      updateSlot(slot, { ...EMPTY_SLOT });
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

  const comparisonMatrix = useMemo(() => {
    if (!(slots.left.font && slots.right.font)) {
      return null;
    }
    return buildComparisonMatrix([
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
  }, [slots.left, slots.right]);

  const commonScripts = useMemo(() => {
    if (!comparisonMatrix) {
      return [];
    }
    const scripts = new Set<string>();
    for (const row of comparisonMatrix.languages) {
      const leftCell = comparisonMatrix.cells.left[row.key];
      const rightCell = comparisonMatrix.cells.right[row.key];
      const leftOk =
        leftCell?.support === "full" || leftCell?.support === "decomposed";
      const rightOk =
        rightCell?.support === "full" || rightCell?.support === "decomposed";
      if (leftOk && rightOk) {
        scripts.add(row.script);
      }
    }
    return [...scripts].sort();
  }, [comparisonMatrix]);

  const leftMetadata = useMemo(
    () =>
      slots.left.font && slots.left.meta
        ? extractFontMetadata(slots.left.font, slots.left.meta.fileName)
        : null,
    [slots.left.font, slots.left.meta]
  );

  const rightMetadata = useMemo(
    () =>
      slots.right.font && slots.right.meta
        ? extractFontMetadata(slots.right.font, slots.right.meta.fileName)
        : null,
    [slots.right.font, slots.right.meta]
  );

  // Resets each slot's axis sliders to the newly loaded font's defaults —
  // otherwise a stale value from the previous font (e.g. "wght": 900) could
  // sit outside the new font's axis range or reference a tag it doesn't have.
  useEffect(() => {
    setAxisValues((prev) => ({
      ...prev,
      left: Object.fromEntries(
        (leftMetadata?.variationAxes ?? []).map((axis) => [
          axis.tag,
          axis.default,
        ])
      ),
    }));
  }, [leftMetadata]);

  useEffect(() => {
    setAxisValues((prev) => ({
      ...prev,
      right: Object.fromEntries(
        (rightMetadata?.variationAxes ?? []).map((axis) => [
          axis.tag,
          axis.default,
        ])
      ),
    }));
  }, [rightMetadata]);

  const leftFontSlot = useMemo(
    () =>
      buildFontSlot(
        slots.left.font,
        leftMetadata,
        slots.left.meta?.fileName,
        slots.left.cssFontFamily
      ),
    [slots.left.font, slots.left.meta, slots.left.cssFontFamily, leftMetadata]
  );

  const rightFontSlot = useMemo(
    () =>
      buildFontSlot(
        slots.right.font,
        rightMetadata,
        slots.right.meta?.fileName,
        slots.right.cssFontFamily
      ),
    [
      slots.right.font,
      slots.right.meta,
      slots.right.cssFontFamily,
      rightMetadata,
    ]
  );

  const leftReady = isSlotReady(slots.left);
  const rightReady = isSlotReady(slots.right);
  const canPreview = leftReady || rightReady;

  return (
    <Section className={COMPARE_SECTION_CLASS} padding={4}>
      <VStack className="pb-4" gap={6} style={{ width: "100%" }}>
        <VStack gap={1}>
          <Heading className="font-sans" level={1}>
            {t("heading")}
          </Heading>
          <Text color="secondary" type="body">
            {t("subheading")}
          </Text>
        </VStack>

        <Grid columns={COMPARE_GRID_COLUMNS} gap={4} style={COMPARE_GRID_STYLE}>
          <GridSpan columns={1}>
            <CompareFontInput
              localFontPickerKey={localFontPickerKeys.left}
              onChange={handleFile}
              onLocalFontClear={handleLocalFontClear}
              onLocalFontSelect={handleLocalFont}
              slot="left"
              state={slots.left}
            />
          </GridSpan>
          <GridSpan columns={1}>
            <CompareFontInput
              localFontPickerKey={localFontPickerKeys.right}
              onChange={handleFile}
              onLocalFontClear={handleLocalFontClear}
              onLocalFontSelect={handleLocalFont}
              slot="right"
              state={slots.right}
            />
          </GridSpan>
        </Grid>

        <Divider variant="subtle" />

        <VStack gap={3}>
          <div className="scrollbar-hidden -mx-1 overflow-x-auto px-1">
            <TabList
              onChange={(v) => setActiveTab(v as TabValue)}
              style={{ flexWrap: "nowrap" }}
              value={activeTab}
            >
              {TAB_VALUES.map((value) => (
                <Tab key={value} label={t(`tabs.${value}`)} value={value} />
              ))}
            </TabList>
          </div>

          {commonScripts.length > 0 ? (
            <HStack gap={2} wrap="wrap">
              {commonScripts.map((script) => (
                <Token key={script} label={script} />
              ))}
            </HStack>
          ) : null}
        </VStack>

        <Card padding={4}>
          <VStack gap={2}>
            <Text type="body">{t("customText.label")}</Text>
            <Text color="secondary" type="supporting">
              {t("customText.hint")}
            </Text>
            <textarea
              className="w-full resize-y rounded-md border border-border bg-body px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus-visible:border-accent"
              onChange={(event) => setCustomText(event.target.value)}
              placeholder={SAMPLE_TEXT}
              rows={2}
              spellCheck={false}
              value={customText}
            />
          </VStack>
        </Card>

        <CompareTabPanels
          activeTab={activeTab}
          axisValues={axisValues}
          canPreview={canPreview}
          comparisonMatrix={comparisonMatrix}
          customText={customText}
          handleAxisChange={handleAxisChange}
          handleFontSizeChange={handleFontSizeChange}
          handleLineHeightChange={handleLineHeightChange}
          leftFontSlot={leftFontSlot}
          leftLineHeight={leftLineHeight}
          leftMetadata={leftMetadata}
          leftSize={leftSize}
          normalLineHeight={normalLineHeight}
          rightFontSlot={rightFontSlot}
          rightLineHeight={rightLineHeight}
          rightMetadata={rightMetadata}
          rightSize={rightSize}
          setNormalLineHeight={setNormalLineHeight}
          setSyncSliders={setSyncSliders}
          slots={slots}
          syncSliders={syncSliders}
        />
      </VStack>
    </Section>
  );
}

function TextTabPanel({
  axisValues,
  canPreview,
  handleAxisChange,
  handleFontSizeChange,
  handleLineHeightChange,
  leftLineHeight,
  leftMetadata,
  leftSize,
  normalLineHeight,
  rightLineHeight,
  rightMetadata,
  rightSize,
  setNormalLineHeight,
  setSyncSliders,
  slots,
  syncSliders,
  text,
}: {
  axisValues: Record<Slot, Record<string, number>>;
  canPreview: boolean;
  handleAxisChange: (slot: Slot, tag: string, value: number) => void;
  handleFontSizeChange: (slot: Slot, value: number) => void;
  handleLineHeightChange: (slot: Slot, value: number) => void;
  leftLineHeight: number;
  leftMetadata: FontMetadata | null;
  leftSize: number;
  normalLineHeight: boolean;
  rightLineHeight: number;
  rightMetadata: FontMetadata | null;
  rightSize: number;
  setNormalLineHeight: (value: boolean) => void;
  setSyncSliders: (value: boolean) => void;
  slots: Record<Slot, FontSlotState>;
  syncSliders: boolean;
  text: string;
}) {
  const t = useTranslations("compare");

  return (
    <VStack gap={4}>
      {canPreview ? (
        <Card padding={4}>
          <HStack gap={6} wrap="wrap">
            <Switch
              label={t("switches.syncSliders")}
              onChange={setSyncSliders}
              value={syncSliders}
            />
            <Switch
              label={t("switches.normalLineHeight")}
              onChange={setNormalLineHeight}
              value={normalLineHeight}
            />
          </HStack>
        </Card>
      ) : null}

      {canPreview ? (
        <Grid columns={COMPARE_GRID_COLUMNS} gap={4} style={COMPARE_GRID_STYLE}>
          <GridSpan columns={1}>
            <ComparisonColumn
              axisValues={axisValues.left}
              fontSize={leftSize}
              lineHeight={leftLineHeight}
              metadata={leftMetadata}
              normalLineHeight={normalLineHeight}
              onAxisChange={handleAxisChange}
              onFontSizeChange={handleFontSizeChange}
              onLineHeightChange={handleLineHeightChange}
              slot="left"
              state={slots.left}
              text={text}
            />
          </GridSpan>
          <GridSpan columns={1}>
            <ComparisonColumn
              axisValues={axisValues.right}
              fontSize={rightSize}
              lineHeight={rightLineHeight}
              metadata={rightMetadata}
              normalLineHeight={normalLineHeight}
              onAxisChange={handleAxisChange}
              onFontSizeChange={handleFontSizeChange}
              onLineHeightChange={handleLineHeightChange}
              slot="right"
              state={slots.right}
              text={text}
            />
          </GridSpan>
        </Grid>
      ) : (
        <CompareEmptyPanel />
      )}
    </VStack>
  );
}

function AboutTabPanel() {
  const t = useTranslations("compare.about");

  return (
    <Card padding={4}>
      <VStack gap={3}>
        <Text as="p" type="body">
          {t("intro")}
        </Text>
        <Text as="p" type="body">
          {t.rich("body", { b: (chunks) => <b>{chunks}</b> })}
        </Text>
      </VStack>
    </Card>
  );
}

function GlyphLevelTabPanel({
  activeTab,
  canPreview,
  leftFontSlot,
  rightFontSlot,
  slots,
}: {
  activeTab: "characters" | "css" | "features" | "overlay";
  canPreview: boolean;
  leftFontSlot: CompareFontSlot | null;
  rightFontSlot: CompareFontSlot | null;
  slots: Record<Slot, FontSlotState>;
}) {
  if (!canPreview) {
    return <CompareEmptyPanel />;
  }
  if (activeTab === "characters") {
    return <CompareCharacters left={slots.left} right={slots.right} />;
  }
  if (activeTab === "features") {
    return <CompareFeatures left={leftFontSlot} right={rightFontSlot} />;
  }
  if (activeTab === "css") {
    return <CompareCss left={leftFontSlot} right={rightFontSlot} />;
  }
  return <CompareOverlay left={slots.left.font} right={slots.right.font} />;
}

function CompareTabPanels({
  activeTab,
  axisValues,
  canPreview,
  comparisonMatrix,
  customText,
  handleAxisChange,
  handleFontSizeChange,
  handleLineHeightChange,
  leftFontSlot,
  leftLineHeight,
  leftMetadata,
  leftSize,
  normalLineHeight,
  rightFontSlot,
  rightLineHeight,
  rightMetadata,
  rightSize,
  setNormalLineHeight,
  setSyncSliders,
  slots,
  syncSliders,
}: {
  activeTab: TabValue;
  axisValues: Record<Slot, Record<string, number>>;
  canPreview: boolean;
  comparisonMatrix: ReturnType<typeof buildComparisonMatrix> | null;
  customText: string;
  handleAxisChange: (slot: Slot, tag: string, value: number) => void;
  handleFontSizeChange: (slot: Slot, value: number) => void;
  handleLineHeightChange: (slot: Slot, value: number) => void;
  leftFontSlot: CompareFontSlot | null;
  leftLineHeight: number;
  leftMetadata: FontMetadata | null;
  leftSize: number;
  normalLineHeight: boolean;
  rightFontSlot: CompareFontSlot | null;
  rightLineHeight: number;
  rightMetadata: FontMetadata | null;
  rightSize: number;
  setNormalLineHeight: (value: boolean) => void;
  setSyncSliders: (value: boolean) => void;
  slots: Record<Slot, FontSlotState>;
  syncSliders: boolean;
}) {
  const t = useTranslations("compare");
  const trimmedCustomText = customText.trim();

  if (activeTab === "text") {
    return (
      <TextTabPanel
        axisValues={axisValues}
        canPreview={canPreview}
        handleAxisChange={handleAxisChange}
        handleFontSizeChange={handleFontSizeChange}
        handleLineHeightChange={handleLineHeightChange}
        leftLineHeight={leftLineHeight}
        leftMetadata={leftMetadata}
        leftSize={leftSize}
        normalLineHeight={normalLineHeight}
        rightLineHeight={rightLineHeight}
        rightMetadata={rightMetadata}
        rightSize={rightSize}
        setNormalLineHeight={setNormalLineHeight}
        setSyncSliders={setSyncSliders}
        slots={slots}
        syncSliders={syncSliders}
        text={trimmedCustomText || SAMPLE_TEXT}
      />
    );
  }

  if (activeTab === "waterfall") {
    return canPreview ? (
      <CompareWaterfall
        left={slots.left}
        right={slots.right}
        text={trimmedCustomText || undefined}
      />
    ) : (
      <CompareEmptyPanel />
    );
  }

  if (
    activeTab === "characters" ||
    activeTab === "features" ||
    activeTab === "css" ||
    activeTab === "overlay"
  ) {
    return (
      <GlyphLevelTabPanel
        activeTab={activeTab}
        canPreview={canPreview}
        leftFontSlot={leftFontSlot}
        rightFontSlot={rightFontSlot}
        slots={slots}
      />
    );
  }

  if (activeTab === "data") {
    return comparisonMatrix ? (
      <CompareData
        leftMeta={leftMetadata}
        matrix={comparisonMatrix}
        rightMeta={rightMetadata}
      />
    ) : (
      <Card padding={4}>
        <Text color="secondary" type="body">
          {t("dataTab.empty")}
        </Text>
      </Card>
    );
  }

  if (activeTab === "pairing") {
    return <ComparePairing left={leftFontSlot} right={rightFontSlot} />;
  }

  return <AboutTabPanel />;
}

import type { Font as FontkitFont } from "fontkit";
import { getColorPalettes, hasColorPalettes } from "./font-color-palettes";
import type { FontMetadata, FontVariationAxisSummary } from "./font-metadata";
import type { NamedVariationInstance } from "./font-variable-instances";
import { getFeatureState } from "./opentype-feature-classification";
import {
  getFeatureUiName,
  getOpenTypeFeatureName,
} from "./opentype-feature-names";
import { getFeatureVariantCss } from "./opentype-feature-variants";

/** The font's own name-table family name (and the uploaded file's name) are
 * attacker-controlled — a crafted upload could otherwise break out of a CSS
 * string value/`url()` here. This output isn't executed as live CSS by this
 * app (copy/download text only), but it's cheap to keep safe for anyone who
 * pastes it into their own stylesheet. Strips control chars first: an
 * unescaped raw newline (CR/LF/FF) inside a quoted CSS string token
 * terminates the string early per the CSS Syntax spec, so escaping just the
 * backslash and quote isn't enough. */
function escapeCssString(value: string): string {
  const withoutControlChars = Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return !(code <= 0x1f || code === 0x7f);
    })
    .join("");
  return withoutControlChars.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const ASTERISK_SLASH = ["*", "/"].join("");

/** CSS comments have no escape mechanism — the only way to keep a
 * comment-closing sequence in attacker-controlled text from ending the
 * comment early is to make sure that exact substring never appears. Built
 * from a joined array (not a regex/string literal containing "*" then "/")
 * so no formatter or editor mistakes it for the start of a block comment. */
function escapeCssComment(value: string): string {
  return escapeCssString(value).split(ASTERISK_SLASH).join("* /");
}

export interface StylesheetOptions {
  /** URL/path to use in `src: url(...)` — the uploaded file's name by default. */
  fileName: string;
  /** Skip the native `font-variant-*` layer and always use `font-feature-settings`. */
  fontFeatureSettingsOnly: boolean;
  /** Add `@font-palette-values` + toggle classes for fonts with multiple CPAL color palettes. */
  includeColorPalettes: boolean;
  /** Also generate CSS for features that are already on by default (rare — mostly for forcing them off). */
  includeDefaultOnFeatures: boolean;
  /** Only generate CSS for these feature tags. `null` means every feature the font has. */
  includeFeatures: string[] | null;
  /** Add a `unicode-range` declaration to `@font-face` listing every codepoint this font supports. */
  includeUnicodeRange: boolean;
  /** Prefix for every custom property/class name, so multiple fonts' generated CSS don't collide. */
  namespace: string;
  /** Variation axis tags to leave out of the generated CSS entirely. */
  skipAxes: string[];
  /** Every codepoint the font supports, for the unicode-range declaration. */
  unicodeRanges: string[];
  /** Map the `wght`/`wdth` axes to native `font-weight`/`font-stretch` instead of raw `font-variation-settings`. */
  useNativeAxisCss: boolean;
}

const WIDTH_CLASS_PERCENT: Record<number, number> = {
  1: 50,
  2: 62.5,
  3: 75,
  4: 87.5,
  5: 100,
  6: 112.5,
  7: 125,
  8: 150,
  9: 200,
};

const MAX_LINE_LENGTH = 100;
const FIRST_OVERRIDE_PALETTE_INDEX = 1;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function propertyName(namespace: string, id: string): string {
  return namespace ? `${namespace}-${id}` : id;
}

function className(namespace: string, id: string): string {
  return propertyName(namespace, id);
}

/** Joins comma-separated parts, wrapping onto a new indented line past maxLength. */
function lineWrap(parts: string[], lineStart: string, indent = 4): string {
  let result = lineStart;
  let lineLength = lineStart.length;
  const pad = " ".repeat(indent);

  parts.forEach((part, index) => {
    const addition = index === 0 ? part : `, ${part}`;
    if (index > 0 && lineLength + addition.length > MAX_LINE_LENGTH) {
      result += `,\n${pad}${part}`;
      lineLength = pad.length + part.length;
    } else {
      result += addition;
      lineLength += addition.length;
    }
  });

  return result;
}

/**
 * fontkit's `type` only distinguishes the outer wrapper (sfnt vs WOFF vs
 * WOFF2), not the inner outline format — an sfnt-wrapped font is `"TTF"`
 * whether it has TrueType (`glyf`) or PostScript (`CFF `) outlines. Check
 * the table list to pick the right CSS `format()` hint for the latter.
 */
function cssFormatHint(metadata: FontMetadata): string {
  switch (metadata.format) {
    case "WOFF2":
      return "woff2";
    case "WOFF":
      return "woff";
    default:
      return metadata.tables.includes("CFF ") ? "opentype" : "truetype";
  }
}

function buildFontFace(
  metadata: FontMetadata,
  options: StylesheetOptions
): string {
  const lines = [
    `  font-family: "${escapeCssString(metadata.familyName)}";`,
    `  src: url("${escapeCssString(options.fileName)}") format("${cssFormatHint(metadata)}");`,
  ];

  const wght = metadata.variationAxes.find((axis) => axis.tag === "wght");
  if (wght) {
    lines.push(`  font-weight: ${wght.min} ${wght.max};`);
  } else {
    lines.push(`  font-weight: ${metadata.weightClass};`);
  }

  const wdth = metadata.variationAxes.find((axis) => axis.tag === "wdth");
  if (wdth) {
    lines.push(`  font-stretch: ${wdth.min}% ${wdth.max}%;`);
  } else {
    const percent = WIDTH_CLASS_PERCENT[metadata.widthClass];
    if (percent) {
      lines.push(`  font-stretch: ${percent}%;`);
    }
  }

  if (options.includeUnicodeRange && options.unicodeRanges.length > 0) {
    lines.push(`${lineWrap(options.unicodeRanges, "  unicode-range: ")};`);
  }

  return `@font-face {\n${lines.join("\n")}\n}`;
}

/**
 * A feature with a native `font-variant-*` equivalent gets a standalone
 * class using that property (plus an `@supports not (...)` fallback to
 * `font-feature-settings` for older browsers) — it's deliberately *not*
 * folded into the custom-property combining mechanism below.
 */
function buildVariantFeatureBlock(tag: string, selector: string): string {
  const variant = getFeatureVariantCss(tag) as string;
  const fallbackValue = `font-feature-settings: "${tag}" on;`;
  const fallback = `

/* for older browsers, optionally add: */
@supports not (${variant}) {
  ${selector} {
    ${fallbackValue}
  }
}`;
  return `${selector} {
  ${variant};
}${fallback}`;
}

interface FeatureCssAccumulator {
  classBlocks: string[];
  declarationParts: string[];
  rootLines: string[];
  selectors: string[];
}

/** Adds a feature to the custom-property combining mechanism (see module doc). */
function addCustomPropertyFeature(
  acc: FeatureCssAccumulator,
  tag: string,
  selector: string,
  namespace: string,
  isOnByDefault: boolean,
  alternateCount: number
): void {
  const propName = propertyName(namespace, tag);
  acc.rootLines.push(`  --${propName}: ${isOnByDefault ? "on" : "off"};`);
  acc.selectors.push(selector);
  acc.declarationParts.push(`"${tag}" var(--${propName})`);

  let value = isOnByDefault ? "off" : "on";
  let comment = isOnByDefault ? " /* This turns the feature off */" : "";
  if (!isOnByDefault && alternateCount > 1) {
    value = "1";
    comment = ` /* Use value 1 to ${alternateCount} for all alternates */`;
  }

  acc.classBlocks.push(
    `${selector} {\n  --${propName}: ${value};${comment}\n}`
  );
}

function buildFeaturesCss(
  font: FontkitFont,
  metadata: FontMetadata,
  featureAlternateCounts: Record<string, number>,
  options: StylesheetOptions
): string {
  const acc: FeatureCssAccumulator = {
    classBlocks: [],
    declarationParts: [],
    rootLines: [],
    selectors: [],
  };

  const tags = options.includeFeatures
    ? metadata.openTypeFeatures.filter((tag) =>
        (options.includeFeatures as string[]).includes(tag)
      )
    : metadata.openTypeFeatures;

  for (const tag of tags) {
    const isOnByDefault = getFeatureState(tag) !== "off";
    if (isOnByDefault && !options.includeDefaultOnFeatures) {
      continue;
    }

    const uiName = getFeatureUiName(font, tag) ?? getOpenTypeFeatureName(tag);
    const selector = `.${className(options.namespace, slugify(uiName) || tag)}`;

    const variant = options.fontFeatureSettingsOnly
      ? null
      : getFeatureVariantCss(tag);
    if (variant) {
      acc.classBlocks.push(buildVariantFeatureBlock(tag, selector));
      continue;
    }

    addCustomPropertyFeature(
      acc,
      tag,
      selector,
      options.namespace,
      isOnByDefault,
      featureAlternateCounts[tag] ?? 0
    );
  }

  if (acc.rootLines.length === 0 && acc.classBlocks.length === 0) {
    return "";
  }

  const parts: string[] = [];
  if (acc.rootLines.length > 0) {
    parts.push(`:root {\n${acc.rootLines.join("\n")}\n}`);
  }
  if (acc.classBlocks.length > 0) {
    parts.push(acc.classBlocks.join("\n\n"));
  }
  if (acc.selectors.length > 0) {
    const declaration = lineWrap(
      acc.declarationParts,
      "  font-feature-settings: "
    );
    parts.push(`${acc.selectors.join(",\n")} {\n${declaration};\n}`);
  }

  return `/**
 * OpenType Layout Features
 */

${parts.join("\n\n")}`;
}

function buildVariableCss(
  metadata: FontMetadata,
  instances: NamedVariationInstance[],
  namespace: string,
  useNativeAxisCss: boolean,
  skipAxes: string[]
): string {
  const axes = metadata.variationAxes.filter(
    (axis) => !skipAxes.includes(axis.tag)
  );
  if (axes.length === 0) {
    return "";
  }

  const isNative = (axis: FontVariationAxisSummary) =>
    useNativeAxisCss && (axis.tag === "wght" || axis.tag === "wdth");

  const rootLines = axes.map(
    (axis) => `  --${propertyName(namespace, axis.tag)}: ${axis.default};`
  );

  const instanceBlocks = instances.map((instance) => {
    const selector = `.${className(namespace, slugify(instance.name))}`;
    const updates = axes.map((axis) => {
      const value = instance.values[axis.tag] ?? axis.default;
      return `  --${propertyName(namespace, axis.tag)}: ${value};`;
    });
    return `${selector} {\n${updates.join("\n")}\n}`;
  });

  const declarationParts = axes
    .filter((axis) => !isNative(axis))
    .map((axis) => `"${axis.tag}" var(--${propertyName(namespace, axis.tag)})`);

  const finalLines: string[] = [];
  const wghtAxis = axes.find((axis) => axis.tag === "wght");
  if (wghtAxis && isNative(wghtAxis)) {
    finalLines.push(
      `  font-weight: var(--${propertyName(namespace, "wght")});`
    );
  }
  const wdthAxis = axes.find((axis) => axis.tag === "wdth");
  if (wdthAxis && isNative(wdthAxis)) {
    finalLines.push(
      `  font-stretch: calc(var(--${propertyName(namespace, "wdth")}) * 1%);`
    );
  }
  if (declarationParts.length > 0) {
    finalLines.push(
      `${lineWrap(declarationParts, "  font-variation-settings: ")};`
    );
  }

  const instanceSelectors =
    instances.length > 0
      ? instances.map(
          (instance) => `.${className(namespace, slugify(instance.name))}`
        )
      : [":root"];

  const sections = [
    `/**
 * Variable axes
 */

:root {
${rootLines.join("\n")}
}`,
  ];

  if (instanceBlocks.length > 0) {
    sections.push(instanceBlocks.join("\n\n"));
  }

  if (finalLines.length > 0) {
    sections.push(
      `${instanceSelectors.join(",\n")} {\n${finalLines.join("\n")}\n}`
    );
  }

  return sections.join("\n\n");
}

function buildPalettesCss(
  font: FontkitFont,
  metadata: FontMetadata,
  namespace: string,
  includeColorPalettes: boolean
): string {
  if (!(includeColorPalettes && hasColorPalettes(font))) {
    return "";
  }

  const palettes = getColorPalettes(font);
  const valueBlocks: string[] = [];
  const classBlocks: string[] = [];

  for (let i = FIRST_OVERRIDE_PALETTE_INDEX; i < palettes.length; i++) {
    const paletteName = className(namespace, `palette-${i}`);
    valueBlocks.push(
      `@font-palette-values --${paletteName} {\n  font-family: "${escapeCssString(metadata.familyName)}";\n  base-palette: ${i};\n}`
    );
    classBlocks.push(`.${paletteName} {\n  font-palette: --${paletteName};\n}`);
  }

  if (valueBlocks.length === 0) {
    return "";
  }

  return `/**
 * Color palettes
 */

${valueBlocks.join("\n\n")}

${classBlocks.join("\n\n")}`;
}

/**
 * Generates a complete, ready-to-use stylesheet for this font: `@font-face`,
 * plus CSS-custom-property-backed classes for every toggleable OpenType
 * feature (falling back to a native `font-variant-*` property + a
 * `font-feature-settings` `@supports` fallback where one exists) and
 * variable axis instance, plus `@font-palette-values` for color fonts with
 * multiple CPAL palettes — the same "combine classes freely" architecture
 * Wakamai Fondue uses (see
 * https://pixelambacht.nl/2019/fixing-variable-font-inheritance/), adapted
 * to this project's own extracted font data instead of vendoring theirs.
 */
export function generateStylesheet(
  font: FontkitFont,
  metadata: FontMetadata,
  instances: NamedVariationInstance[],
  featureAlternateCounts: Record<string, number>,
  options: StylesheetOptions
): string {
  const intro = `/**
 * CSS for ${escapeCssComment(metadata.familyName)}
 */`;

  const sections = [
    intro,
    buildFontFace(metadata, options),
    buildFeaturesCss(font, metadata, featureAlternateCounts, options),
    buildVariableCss(
      metadata,
      instances,
      options.namespace,
      options.useNativeAxisCss,
      options.skipAxes
    ),
    buildPalettesCss(
      font,
      metadata,
      options.namespace,
      options.includeColorPalettes
    ),
  ].filter((section) => section !== "");

  return `${sections.join("\n\n")}\n`;
}

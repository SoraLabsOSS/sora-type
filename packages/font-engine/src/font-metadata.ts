import type { Font as FontkitFont } from "fontkit";

export interface FontEmbeddingPermissions {
  bitmapOnly: boolean;
  editable: boolean;
  noEmbedding: boolean;
  noSubsetting: boolean;
  viewOnly: boolean;
}

export interface FontMetricsSummary {
  ascent: number;
  capHeight: number;
  descent: number;
  italicAngle: number;
  lineGap: number;
  underlinePosition: number;
  underlineThickness: number;
  unitsPerEm: number;
  xHeight: number;
}

export interface FontVariationAxisSummary {
  default: number;
  max: number;
  min: number;
  name: string;
  tag: string;
}

export interface FontMetadata {
  copyright: string | null;
  description: string | null;
  designer: string | null;
  designerUrl: string | null;
  embedding: FontEmbeddingPermissions;
  embeddingSummary: string;
  familyClassification: FontFamilyClassification;
  familyName: string;
  fileName: string;
  format: FontkitFont["type"];
  fullName: string;
  isHinted: boolean;
  license: string | null;
  licenseUrl: string | null;
  manufacturer: string | null;
  metrics: FontMetricsSummary;
  numGlyphs: number;
  openTypeFeatures: string[];
  outlineFormats: string[];
  postscriptName: string;
  style: string;
  tables: string[];
  trademark: string | null;
  variationAxes: FontVariationAxisSummary[];
  vendorUrl: string | null;
  version: string | null;
  weightClass: number;
  weightLabel: string;
  widthClass: number;
  widthLabel: string;
}

export type FontFamilyClassification =
  | "decorative"
  | "sans-serif"
  | "script"
  | "serif"
  | "unknown";

export const FAMILY_CLASSIFICATION_LABELS: Record<
  FontFamilyClassification,
  string
> = {
  serif: "Serif",
  "sans-serif": "Sans-serif",
  script: "Script",
  decorative: "Decorative",
  unknown: "Unknown",
};

const NAME_LANG = "en";

const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

const WIDTH_LABELS: Record<number, string> = {
  1: "Ultra Condensed",
  2: "Extra Condensed",
  3: "Condensed",
  4: "Semi Condensed",
  5: "Normal",
  6: "Semi Expanded",
  7: "Expanded",
  8: "Extra Expanded",
  9: "Ultra Expanded",
};

function readName(font: FontkitFont, key: string): string | null {
  const value = font.getName(key, NAME_LANG);
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
/** Placeholder strings some subsetting pipelines write into name IDs when
 * they blank the real family/full/postscript names (seen on Webflow WebXL). */
const PLACEHOLDER_NAME = /^(font|untitled|null|undefined)$/i;

/**
 * Some web-optimized/subsetted fonts (seen in the wild on Webflow's "WebXL"
 * pipeline) ship a blank or single-placeholder-character family/full/
 * subfamily name while every other name-table field stays intact — fontkit
 * faithfully returns whatever's actually there (e.g. an empty string, or a
 * lone "¶"), which then rendered as-is looks like a Sora Type display bug
 * rather than a broken font. A name with no letters or digits at all isn't
 * a usable display name regardless of what codepoint it happens to be.
 */
function isUsableName(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  return HAS_LETTER_OR_DIGIT.test(trimmed) && !PLACEHOLDER_NAME.test(trimmed);
}

const FILE_EXTENSION_SUFFIX = /\.[^./]+$/;
const NAME_SEPARATOR_CHARS = /[-_]+/g;
/** Webflow (and similar CDNs) prefix assets with a long hex id:
 * `69c69d75a0cda52c270e65bf_SuisseIntlMono-Regular-WebXL.woff2`. */
const CDN_HASH_PREFIX = /^[a-f0-9]{16,}[_-]+/i;
/** Export-pipeline suffixes that aren't part of the typeface name. */
const WEBFONT_EXPORT_SUFFIX = /[-_]?(?:WebXL|WebOF|webfont|subset)$/i;

/** Derives a readable fallback name from the uploaded file name when the
 * font's own name-table strings aren't usable. */
function nameFromFileName(fileName: string): string {
  const spaced = fileName
    .replace(FILE_EXTENSION_SUFFIX, "")
    .replace(CDN_HASH_PREFIX, "")
    .replace(WEBFONT_EXPORT_SUFFIX, "")
    .replace(NAME_SEPARATOR_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  return spaced.length > 0 ? spaced : "Untitled font";
}

/** Prefer typographic (preferredFamily) names, then the legacy family name,
 * then a cleaned PostScript name, then the file name — skipping blank /
 * placeholder name-table entries from subsetting pipelines. */
function resolveFamilyName(
  font: FontkitFont,
  fileName: string
): {
  familyName: string;
  fromNameTable: boolean;
} {
  const preferred = readName(font, "preferredFamily");
  if (isUsableName(preferred)) {
    return { familyName: preferred, fromNameTable: true };
  }
  if (isUsableName(font.familyName)) {
    return { familyName: font.familyName.trim(), fromNameTable: true };
  }
  if (isUsableName(font.postscriptName)) {
    return {
      familyName: font.postscriptName.replace(NAME_SEPARATOR_CHARS, " ").trim(),
      fromNameTable: false,
    };
  }
  return { familyName: nameFromFileName(fileName), fromNameTable: false };
}

function resolveStyleName(font: FontkitFont): string {
  const preferred = readName(font, "preferredSubfamily");
  if (isUsableName(preferred)) {
    return preferred;
  }
  if (isUsableName(font.subfamilyName)) {
    return font.subfamilyName.trim();
  }
  return "Regular";
}

/** When the family fallback was derived from a filename like
 * `Foo-Regular-WebXL`, the style token is often still sitting on the end —
 * strip it so we don't surface "Foo Regular" + style "Regular". */
function stripTrailingStyle(familyName: string, style: string): string {
  const pattern = new RegExp(
    `(?:^|\\s+)${style.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i"
  );
  const stripped = familyName.replace(pattern, "").trim();
  return stripped.length > 0 ? stripped : familyName;
}

/**
 * A font can author its own recommended preview sentence via the `name`
 * table's nameID 19 ("Sample text") — e.g. a display face might ship
 * "Handcrafted Lettering" instead of a generic pangram. Used to seed the
 * Preview/Tester default text when present.
 */
export function getFontSampleText(font: FontkitFont): string | null {
  return readName(font, "sampleText");
}

function formatWeightClass(weightClass: number): string {
  const label = WEIGHT_LABELS[weightClass];
  if (label) {
    return `${label} (${weightClass})`;
  }
  return String(weightClass);
}

function formatWidthClass(widthClass: number): string {
  const label = WIDTH_LABELS[widthClass];
  if (label) {
    return `${label} (${widthClass})`;
  }
  return String(widthClass);
}

export function summarizeEmbedding(
  permissions: FontEmbeddingPermissions
): string {
  if (permissions.noEmbedding) {
    return "No embedding allowed";
  }
  if (permissions.viewOnly) {
    return "Preview and print only";
  }
  if (permissions.editable) {
    return "Editable embedding allowed";
  }
  if (permissions.noSubsetting) {
    return "Installable, no subsetting";
  }
  if (permissions.bitmapOnly) {
    return "Bitmap embedding only";
  }
  return "Installable embedding allowed";
}

function getRawTableTags(font: FontkitFont): Record<string, unknown> {
  return (
    (
      font as FontkitFont & {
        directory?: { tables?: Record<string, unknown> };
      }
    ).directory?.tables ?? {}
  );
}

function getTableTags(font: FontkitFont): string[] {
  return Object.keys(getRawTableTags(font)).toSorted();
}

// A handful of Google Fonts ship a `prep` table containing only this fixed
// instruction sequence as a build-tool artifact, not real hinting — see
// https://github.com/googlefonts/fontbakery/issues/3076.
const SIMPLE_PREP_PROGRAM = [184, 1, 255, 133, 176, 4, 141].toString();
const HINTING_TABLE_TAGS = ["cvt ", "cvar", "fpgm", "hdmx", "VDMX"];

/** Whether this font ships any of the "helper tables" hinted fonts use. */
function isHinted(font: FontkitFont): boolean {
  const tables = getRawTableTags(font);
  if (HINTING_TABLE_TAGS.some((tag) => tag in tables)) {
    return true;
  }
  const prep = (
    font as FontkitFont & { prep?: { controlValueProgram: number[] } }
  ).prep;
  return Boolean(
    prep && prep.controlValueProgram.toString() !== SIMPLE_PREP_PROGRAM
  );
}

const OUTLINE_TABLE_NAMES: Record<string, string> = {
  "CFF ": "OpenType CFF",
  CFF2: "OpenType CFF2",
  glyf: "TrueType glyf",
};

/** Glyph outline format(s) this font uses (CFF/CFF2 vs. TrueType glyf). */
function getOutlineFormats(font: FontkitFont): string[] {
  const tables = getRawTableTags(font);
  return Object.entries(OUTLINE_TABLE_NAMES)
    .filter(([tag]) => tag in tables)
    .map(([, name]) => name);
}

/**
 * Reads the OS/2 `panose` byte array (bFamilyType, bSerifStyle, ...) — a
 * classification the font's own author encodes, so this needs no glyph
 * outline analysis. Many fonts leave it unset (all zeros), which is why
 * "unknown" is a real, common outcome rather than a theoretical fallback.
 */
function classifyPanose(
  panose: number[] | undefined
): FontFamilyClassification {
  const [familyType, serifStyle] = panose ?? [];
  if (familyType === 2) {
    // Latin Text/Display — bSerifStyle 0/1 mean Any/No Fit (unset), 11-15
    // are the sans-serif variants, everything else in 2-10 has a real serif.
    if (serifStyle === undefined || serifStyle <= 1) {
      return "unknown";
    }
    return serifStyle >= 11 && serifStyle <= 15 ? "sans-serif" : "serif";
  }
  if (familyType === 3) {
    return "script";
  }
  if (familyType === 4) {
    return "decorative";
  }
  return "unknown";
}

function getVariationAxes(font: FontkitFont): FontVariationAxisSummary[] {
  return Object.entries(font.variationAxes ?? {})
    .flatMap(([tag, axis]) =>
      axis
        ? [
            {
              tag,
              name: axis.name,
              min: axis.min,
              default: axis.default,
              max: axis.max,
            },
          ]
        : []
    )
    .toSorted((a, b) => a.tag.localeCompare(b.tag));
}

export function extractFontMetadata(
  font: FontkitFont,
  fileName: string
): FontMetadata {
  const os2 = font["OS/2"] as FontkitFont["OS/2"] | undefined;
  const embedding: FontEmbeddingPermissions = os2
    ? {
        noEmbedding: os2.fsType.noEmbedding,
        viewOnly: os2.fsType.viewOnly,
        editable: os2.fsType.editable,
        noSubsetting: os2.fsType.noSubsetting,
        bitmapOnly: os2.fsType.bitmapOnly,
      }
    : {
        noEmbedding: false,
        viewOnly: false,
        editable: false,
        noSubsetting: false,
        bitmapOnly: false,
      };

  const versionFromName = readName(font, "version");
  const version =
    versionFromName ??
    (font.version !== undefined && font.version !== null
      ? String(font.version).trim() || null
      : null);

  const resolved = resolveFamilyName(font, fileName);
  const style = resolveStyleName(font);
  const familyName = resolved.fromNameTable
    ? resolved.familyName
    : stripTrailingStyle(resolved.familyName, style);
  // Only append style when familyName came from real name-table data —
  // when it's itself a filename/postscript-derived fallback (which often
  // already reads like "Foo Regular"), appending style again would just
  // duplicate it (e.g. "...Regular Regular").
  let fullName = font.fullName;
  if (isUsableName(fullName)) {
    fullName = fullName.trim();
  } else {
    fullName = `${familyName} ${style}`.trim();
  }

  return {
    fileName,
    fullName,
    familyName,
    style,
    postscriptName: isUsableName(font.postscriptName)
      ? font.postscriptName
      : familyName.replace(/\s+/g, ""),
    format: font.type,
    version,
    copyright: font.copyright?.trim() || readName(font, "copyright"),
    trademark: readName(font, "trademark"),
    manufacturer: readName(font, "manufacturer"),
    designer: readName(font, "designer"),
    description: readName(font, "description"),
    vendorUrl: readName(font, "vendorURL"),
    designerUrl: readName(font, "designerURL"),
    license: readName(font, "license"),
    licenseUrl: readName(font, "licenseURL"),
    numGlyphs: font.numGlyphs,
    isHinted: isHinted(font),
    outlineFormats: getOutlineFormats(font),
    weightClass: os2?.usWeightClass ?? 400,
    weightLabel: formatWeightClass(os2?.usWeightClass ?? 400),
    widthClass: os2?.usWidthClass ?? 5,
    widthLabel: formatWidthClass(os2?.usWidthClass ?? 5),
    familyClassification: classifyPanose(os2?.panose),
    embedding,
    embeddingSummary: summarizeEmbedding(embedding),
    metrics: {
      unitsPerEm: font.unitsPerEm,
      ascent: font.ascent,
      descent: font.descent,
      lineGap: font.lineGap,
      capHeight: font.capHeight,
      xHeight: font.xHeight,
      italicAngle: font.italicAngle,
      underlinePosition: font.underlinePosition,
      underlineThickness: font.underlineThickness,
    },
    openTypeFeatures: [...font.availableFeatures].toSorted(),
    tables: getTableTags(font),
    variationAxes: getVariationAxes(font),
  };
}

export interface FontDetailField {
  label: string;
  value: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildFontSummaryFields(
  metadata: FontMetadata,
  scriptSummary?: string
): FontDetailField[] {
  const fields: Array<FontDetailField | null> = [
    metadata.familyName.trim()
      ? { label: "Font family", value: metadata.familyName }
      : null,
    metadata.designer ? { label: "Designer", value: metadata.designer } : null,
    metadata.version ? { label: "Version", value: metadata.version } : null,
    metadata.license ? { label: "License", value: metadata.license } : null,
    scriptSummary ? { label: "Scripts", value: scriptSummary } : null,
    metadata.variationAxes.length > 0
      ? {
          label: "Axes",
          value: metadata.variationAxes.map((axis) => axis.tag).join(", "),
        }
      : null,
  ];

  return fields.filter((field): field is FontDetailField => field !== null);
}

export function buildFontDetailFields(
  metadata: FontMetadata
): FontDetailField[] {
  const fields: Array<FontDetailField | null> = [
    { label: "PostScript name", value: metadata.postscriptName },
    metadata.version ? { label: "Version", value: metadata.version } : null,
    { label: "Format", value: metadata.format },
    { label: "Weight", value: metadata.weightLabel },
    { label: "Width", value: metadata.widthLabel },
    metadata.familyClassification === "unknown"
      ? null
      : {
          label: "Classification",
          value: FAMILY_CLASSIFICATION_LABELS[metadata.familyClassification],
        },
    { label: "Embedding", value: metadata.embeddingSummary },
    metadata.designer ? { label: "Designer", value: metadata.designer } : null,
    metadata.manufacturer
      ? { label: "Manufacturer", value: metadata.manufacturer }
      : null,
    metadata.description
      ? { label: "Description", value: metadata.description }
      : null,
    metadata.license ? { label: "License", value: metadata.license } : null,
    metadata.licenseUrl
      ? { label: "License URL", value: metadata.licenseUrl }
      : null,
    metadata.copyright
      ? { label: "Copyright", value: metadata.copyright }
      : null,
    metadata.trademark
      ? { label: "Trademark", value: metadata.trademark }
      : null,
    metadata.designerUrl
      ? { label: "Designer URL", value: metadata.designerUrl }
      : null,
    metadata.vendorUrl
      ? { label: "Vendor URL", value: metadata.vendorUrl }
      : null,
    {
      label: "Units per em",
      value: String(metadata.metrics.unitsPerEm),
    },
    {
      label: "Ascender",
      value: String(metadata.metrics.ascent),
    },
    {
      label: "Descender",
      value: String(metadata.metrics.descent),
    },
    {
      label: "Line gap",
      value: String(metadata.metrics.lineGap),
    },
    {
      label: "Cap height",
      value: String(metadata.metrics.capHeight),
    },
    {
      label: "x-height",
      value: String(metadata.metrics.xHeight),
    },
  ];

  return fields.filter((field): field is FontDetailField => field !== null);
}

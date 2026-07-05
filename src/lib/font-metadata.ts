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
  familyName: string;
  fileName: string;
  format: FontkitFont["type"];
  fullName: string;
  license: string | null;
  licenseUrl: string | null;
  manufacturer: string | null;
  metrics: FontMetricsSummary;
  numGlyphs: number;
  openTypeFeatures: string[];
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

function getTableTags(font: FontkitFont): string[] {
  const tables = (
    font as FontkitFont & { directory?: { tables?: Record<string, unknown> } }
  ).directory?.tables;
  if (!tables) {
    return [];
  }
  return Object.keys(tables).toSorted();
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
  const os2 = font["OS/2"];
  const embedding: FontEmbeddingPermissions = {
    noEmbedding: os2.fsType.noEmbedding,
    viewOnly: os2.fsType.viewOnly,
    editable: os2.fsType.editable,
    noSubsetting: os2.fsType.noSubsetting,
    bitmapOnly: os2.fsType.bitmapOnly,
  };

  const versionFromName = readName(font, "version");
  const version =
    versionFromName ??
    (font.version ? String(font.version).trim() || null : null);

  return {
    fileName,
    fullName: font.fullName,
    familyName: font.familyName,
    style: font.subfamilyName,
    postscriptName: font.postscriptName,
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
    weightClass: os2.usWeightClass,
    weightLabel: formatWeightClass(os2.usWeightClass),
    widthClass: os2.usWidthClass,
    widthLabel: formatWidthClass(os2.usWidthClass),
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
    { label: "Font family", value: metadata.familyName },
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

import type { Font as FontkitFont } from "fontkit";

const TABLE_DESCRIPTIONS: Record<string, string> = {
  avar: "Axis Variations Table",
  BASE: "Baseline Table",
  "CFF ": "Compact Font Format Table",
  CFF2: "Compact Font Format 2 Table",
  cmap: "Character To Glyph Index Mapping Table",
  COLR: "Color Table",
  CPAL: "Color Palette Table",
  cvt: "Control Value Table",
  DSIG: "Digital Signature Table",
  fpgm: "Font Program Table",
  fvar: "Font Variations Table",
  gasp: "Grid-fitting And Scan-conversion Procedure Table",
  GDEF: "Glyph Definition Table",
  glyf: "Glyph Data Table",
  GPOS: "Glyph Positioning Table",
  GSUB: "Glyph Substitution Table",
  gvar: "Glyph Variations Table",
  head: "Font Header Table",
  hhea: "Horizontal Header Table",
  hmtx: "Horizontal Metrics Table",
  HVAR: "Horizontal Metrics Variations Table",
  JSTF: "Justification Table",
  kern: "Kerning Table",
  loca: "Index To Location Table",
  maxp: "Maximum Profile Table",
  meta: "Metadata Table",
  MVAR: "Metrics Variations Table",
  name: "Naming Table",
  "OS/2": "OS/2 And Windows Metrics Table",
  post: "PostScript Table",
  prep: "Control Value Program Table",
  sbix: "Standard Bitmap Graphics Table",
  STAT: "Style Attributes Table",
  vhea: "Vertical Header Table",
  vmtx: "Vertical Metrics Table",
  VORG: "Vertical Origin Table",
  VVAR: "Vertical Metrics Variations Table",
};

export function describeTableTag(tag: string): string {
  return TABLE_DESCRIPTIONS[tag] ?? "Font Table";
}

export function getRawTableTags(font: FontkitFont): string[] {
  const tables = (
    font as FontkitFont & { directory?: { tables?: Record<string, unknown> } }
  ).directory?.tables;
  if (!tables) {
    return [];
  }
  return Object.keys(tables).toSorted((a, b) => a.localeCompare(b));
}

export function getRawTableData(font: FontkitFont, tag: string): unknown {
  try {
    return (font as unknown as Record<string, unknown>)[tag] ?? null;
  } catch {
    return null;
  }
}

export interface RawDisplayRow {
  key: string;
  value: string;
}

const NAME_FIELD_KEYS = [
  "copyright",
  "description",
  "designer",
  "designerURL",
  "fontFamily",
  "fontSubfamily",
  "fullName",
  "manufacturer",
  "manufacturerURL",
  "postScriptName",
  "trademark",
  "version",
  "license",
  "licenseURL",
  "vendorURL",
] as const;

const BINARY_SUMMARY_TAGS = new Set([
  "COLR",
  "CPAL",
  "CFF ",
  "CFF2",
  "GDEF",
  "GPOS",
  "GSUB",
  "HVAR",
  "MVAR",
  "VVAR",
  "cvt ",
  "fpgm",
  "glyf",
  "gvar",
  "hmtx",
  "kern",
  "loca",
  "prep",
  "sbix",
  "vmtx",
]);

const RIGHT_TABLE_ORDER = [
  "OS/2",
  "head",
  "hhea",
  "maxp",
  "post",
  "vhea",
  "fvar",
  "STAT",
  "gasp",
  "cmap",
  "meta",
  "FFTM",
  "avar",
  "BASE",
  "DSIG",
  "JSTF",
  "VORG",
] as const;

const NAME_LANG = "en";
const MAX_INLINE_ARRAY_ITEMS = 24;
const MAX_INLINE_STRING_LENGTH = 320;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !ArrayBuffer.isView(value) &&
    !(value instanceof ArrayBuffer)
  );
}

function truncate(value: string, max = MAX_INLINE_STRING_LENGTH): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

export function formatRawDisplayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    const length = "byteLength" in value ? value.byteLength : 0;
    return `${length.toLocaleString()} bytes`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    const visible = value.slice(0, MAX_INLINE_ARRAY_ITEMS);
    const formatted = visible
      .map((item) => formatRawDisplayValue(item))
      .filter((item): item is string => item !== null);
    const suffix =
      value.length > MAX_INLINE_ARRAY_ITEMS
        ? ` … +${value.length - MAX_INLINE_ARRAY_ITEMS}`
        : "";

    return `[${formatted.join(", ")}]${suffix}`;
  }

  if (isPlainRecord(value)) {
    try {
      return truncate(JSON.stringify(value));
    } catch {
      return "…";
    }
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  const text = String(value).trim();
  return text.length > 0 ? truncate(text) : null;
}

function summarizeBinaryTable(tag: string, raw: unknown): string | null {
  const formatted = formatRawDisplayValue(raw);
  if (formatted) {
    return formatted;
  }

  const tableBytes = (raw as { length?: number } | null | undefined)?.length;
  if (typeof tableBytes === "number") {
    return `${tableBytes.toLocaleString()} bytes`;
  }

  return describeTableTag(tag);
}

function flattenTableRows(
  tag: string,
  data: unknown,
  rows: RawDisplayRow[]
): void {
  if (!isPlainRecord(data)) {
    const formatted = formatRawDisplayValue(data);
    if (formatted) {
      rows.push({ key: tag, value: formatted });
    }
    return;
  }

  for (const [fieldKey, fieldValue] of Object.entries(data)) {
    if (tag === "name" && fieldKey === "records") {
      continue;
    }

    if (fieldKey === "tables" && Array.isArray(fieldValue)) {
      rows.push({
        key: tag === "OS/2" ? fieldKey : `${tag}.${fieldKey}`,
        value: `Array (${fieldValue.length})`,
      });
      continue;
    }

    const formatted = formatRawDisplayValue(fieldValue);
    if (!formatted) {
      continue;
    }

    rows.push({
      key: tag === "OS/2" ? fieldKey : `${tag}.${fieldKey}`,
      value: formatted,
    });
  }
}

/** FontDrop-style two-column dump: naming fields left, table metrics right. */
export function buildRawDisplayColumns(font: FontkitFont): {
  left: RawDisplayRow[];
  right: RawDisplayRow[];
} {
  const left: RawDisplayRow[] = [];
  const right: RawDisplayRow[] = [];

  for (const key of NAME_FIELD_KEYS) {
    const value = font.getName(key, NAME_LANG);
    const formatted = value ? formatRawDisplayValue(value.trim()) : null;
    if (formatted) {
      left.push({ key, value: formatted });
    }
  }

  const tags = getRawTableTags(font);
  const tagSet = new Set(tags);
  const orderedTags = [
    ...RIGHT_TABLE_ORDER.filter((tag) => tagSet.has(tag)),
    ...tags.filter(
      (tag) =>
        tag !== "name" &&
        !RIGHT_TABLE_ORDER.includes(tag as (typeof RIGHT_TABLE_ORDER)[number])
    ),
  ].filter((tag, index, all) => all.indexOf(tag) === index);

  for (const tag of orderedTags) {
    const data = getRawTableData(font, tag);
    if (data === null) {
      continue;
    }

    if (BINARY_SUMMARY_TAGS.has(tag)) {
      const summary = summarizeBinaryTable(tag, data);
      if (summary) {
        right.push({ key: tag, value: summary });
      }
      continue;
    }

    flattenTableRows(tag, data, right);
  }

  return { left, right };
}

import type { Font as FontkitFont } from "fontkit";

const TABLE_DESCRIPTIONS: Record<string, string> = {
  avar: "Axis Variations Table",
  BASE: "Baseline Table",
  "CFF ": "Compact Font Format Table",
  CFF2: "Compact Font Format 2 Table",
  cmap: "Character To Glyph Index Mapping Table",
  COLR: "Color Table",
  CPAL: "Color Palette Table",
  "cvt ": "Control Value Table",
  DSIG: "Digital Signature Table",
  FFTM: "Font Fabrication Tool Metrics Table",
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

type FontDirectory = FontkitFont & {
  directory?: {
    tables?: Record<string, { length?: number }>;
  };
};

export function getRawTableTags(font: FontkitFont): string[] {
  const tables = (font as FontDirectory).directory?.tables;
  if (!tables) {
    return [];
  }
  return Object.keys(tables).toSorted((a, b) => a.localeCompare(b));
}

export function getTableByteLength(
  font: FontkitFont,
  tag: string
): number | null {
  const length = (font as FontDirectory).directory?.tables?.[tag]?.length;
  return typeof length === "number" ? length : null;
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

export interface RawTableInventoryEntry {
  byteLength: number;
  description: string;
  parsed: boolean;
  tag: string;
}

export interface RawTableSection extends RawTableInventoryEntry {
  rows: RawDisplayRow[];
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

function formatBytes(byteLength: number): string {
  return `${byteLength.toLocaleString()} bytes`;
}

function formatOpenTypeVersion(version: unknown): string | null {
  if (typeof version !== "number") {
    return null;
  }
  const major = Math.floor(version / 65_536);
  const minor = version % 65_536;
  return `${major}.${minor}`;
}

function listLength(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object" && "length" in value) {
    const length = (value as { length?: unknown }).length;
    if (typeof length === "number") {
      return length;
    }
  }
  return 0;
}

function summarizeLayoutTable(
  tag: "GPOS" | "GSUB",
  data: Record<string, unknown>
): string {
  const version = formatOpenTypeVersion(data.version);
  const scripts = listLength(data.scriptList);
  const featureList = data.featureList;
  const featureTags =
    Array.isArray(featureList) && featureList.length > 0
      ? [
          ...new Set(
            featureList
              .map((feature) =>
                isPlainRecord(feature) && typeof feature.tag === "string"
                  ? feature.tag
                  : null
              )
              .filter((featureTag): featureTag is string => featureTag !== null)
          ),
        ]
      : [];
  const lookups = listLength(data.lookupList);
  const parts = [
    version ? `version ${version}` : null,
    `${scripts} script${scripts === 1 ? "" : "s"}`,
    `${featureTags.length} feature${featureTags.length === 1 ? "" : "s"}${featureTags.length > 0 ? `: ${featureTags.join(", ")}` : ""}`,
    `${lookups} lookup${lookups === 1 ? "" : "s"}`,
  ].filter((part): part is string => part !== null);

  return `${tag} · ${parts.join(" · ")}`;
}

function summarizeHmtxTable(data: Record<string, unknown>): string {
  const metrics = listLength(data.metrics);
  const bearings = listLength(data.bearings);
  return `hmtx · ${metrics.toLocaleString()} horizontal metric${metrics === 1 ? "" : "s"} · ${bearings.toLocaleString()} left sidebearing${bearings === 1 ? "" : "s"}`;
}

function layoutDetailRows(data: Record<string, unknown>): RawDisplayRow[] {
  const rows: RawDisplayRow[] = [];
  const version = formatOpenTypeVersion(data.version);
  if (version) {
    rows.push({ key: "version", value: version });
  }

  const scriptList = data.scriptList;
  if (Array.isArray(scriptList)) {
    const scriptTags = scriptList
      .map((script) =>
        isPlainRecord(script) && typeof script.tag === "string"
          ? script.tag
          : null
      )
      .filter((scriptTag): scriptTag is string => scriptTag !== null);
    rows.push({
      key: "scripts",
      value: scriptTags.length > 0 ? scriptTags.join(", ") : "—",
    });
  }

  const featureList = data.featureList;
  if (Array.isArray(featureList)) {
    const featureTags = [
      ...new Set(
        featureList
          .map((feature) =>
            isPlainRecord(feature) && typeof feature.tag === "string"
              ? feature.tag
              : null
          )
          .filter((featureTag): featureTag is string => featureTag !== null)
      ),
    ];
    rows.push({
      key: "featureCount",
      value: featureTags.length.toLocaleString(),
    });
    rows.push({
      key: "features",
      value: featureTags.length > 0 ? featureTags.join(", ") : "—",
    });
  }

  const lookups = listLength(data.lookupList);
  rows.push({ key: "lookupCount", value: lookups.toLocaleString() });

  return rows;
}

function hmtxDetailRows(data: Record<string, unknown>): RawDisplayRow[] {
  const metrics = listLength(data.metrics);
  const bearings = listLength(data.bearings);
  return [
    {
      key: "horizontalMetrics",
      value: metrics.toLocaleString(),
    },
    {
      key: "leftSidebearings",
      value: bearings.toLocaleString(),
    },
  ];
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
    return formatBytes(length);
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
      return null;
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

function summarizeBinaryTable(
  tag: string,
  raw: unknown,
  byteLength: number | null
): string | null {
  if (isPlainRecord(raw)) {
    if (tag === "GPOS" || tag === "GSUB") {
      return summarizeLayoutTable(tag, raw);
    }
    if (tag === "hmtx") {
      return summarizeHmtxTable(raw);
    }
  }

  const formatted = formatRawDisplayValue(raw);
  if (formatted) {
    return formatted;
  }

  if (byteLength !== null) {
    return formatBytes(byteLength);
  }

  const tableBytes = (raw as { length?: number } | null | undefined)?.length;
  if (typeof tableBytes === "number") {
    return formatBytes(tableBytes);
  }

  return describeTableTag(tag);
}

function appendNameRows(font: FontkitFont, rows: RawDisplayRow[]): void {
  const nameTable = getRawTableData(font, "name");
  if (!isPlainRecord(nameTable)) {
    return;
  }

  const records = nameTable.records;
  if (!isPlainRecord(records)) {
    return;
  }

  const entries: { key: string; sortKey: string; value: string }[] = [];

  for (const [fieldKey, languages] of Object.entries(records)) {
    if (!isPlainRecord(languages)) {
      continue;
    }

    for (const [language, value] of Object.entries(languages)) {
      if (typeof value !== "string") {
        continue;
      }

      const formatted = formatRawDisplayValue(value.trim());
      if (!formatted) {
        continue;
      }

      const key =
        language === NAME_LANG ? fieldKey : `${fieldKey} [${language}]`;
      entries.push({
        key,
        sortKey: `${fieldKey}\0${language}`,
        value: formatted,
      });
    }
  }

  entries.sort((left, right) => left.sortKey.localeCompare(right.sortKey));

  for (const entry of entries) {
    rows.push({ key: entry.key, value: entry.value });
  }
}

function appendFallbackNameRows(
  font: FontkitFont,
  rows: RawDisplayRow[]
): void {
  for (const key of NAME_FIELD_KEYS) {
    const value = font.getName(key, NAME_LANG);
    const formatted = value ? formatRawDisplayValue(value.trim()) : null;
    if (formatted) {
      rows.push({ key, value: formatted });
    }
  }
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

function getOrderedTableTags(font: FontkitFont): string[] {
  const tags = getRawTableTags(font);
  const tagSet = new Set(tags);
  return [
    ...RIGHT_TABLE_ORDER.filter((tag) => tagSet.has(tag)),
    ...tags.filter(
      (tag) =>
        tag !== "name" &&
        !RIGHT_TABLE_ORDER.includes(tag as (typeof RIGHT_TABLE_ORDER)[number])
    ),
  ].filter((tag, index, all) => all.indexOf(tag) === index);
}

function buildNameSectionRows(
  font: FontkitFont,
  data: unknown
): RawDisplayRow[] {
  const rows: RawDisplayRow[] = [];
  appendNameRows(font, rows);
  if (rows.length === 0) {
    appendFallbackNameRows(font, rows);
  }
  if (!isPlainRecord(data)) {
    return rows;
  }

  for (const [fieldKey, fieldValue] of Object.entries(data)) {
    if (fieldKey === "records") {
      continue;
    }
    const formatted = formatRawDisplayValue(fieldValue);
    if (formatted) {
      rows.push({ key: fieldKey, value: formatted });
    }
  }

  return rows;
}

function buildUnparsedSectionRows(byteLength: number | null): RawDisplayRow[] {
  const rows: RawDisplayRow[] = [];
  if (byteLength !== null) {
    rows.push({ key: "size", value: formatBytes(byteLength) });
  }
  rows.push({
    key: "note",
    value:
      "Present in the font file but not decoded in the browser. Use fonttools or a desktop font editor to inspect the raw binary table.",
  });
  return rows;
}

function buildBinarySectionRows(
  tag: string,
  data: unknown,
  byteLength: number | null
): RawDisplayRow[] {
  const rows: RawDisplayRow[] = [];
  flattenTableRows(tag, data, rows);
  if (rows.length > 0) {
    return rows;
  }
  const summary = summarizeBinaryTable(tag, data, byteLength);
  if (summary) {
    rows.push({ key: "summary", value: summary });
  }
  return rows;
}

function buildTableSectionRows(
  tag: string,
  font: FontkitFont,
  data: unknown,
  byteLength: number | null
): RawDisplayRow[] {
  if (tag === "name") {
    return buildNameSectionRows(font, data);
  }

  if (data === null) {
    return buildUnparsedSectionRows(byteLength);
  }

  if (tag === "GPOS" || tag === "GSUB") {
    return isPlainRecord(data) ? layoutDetailRows(data) : [];
  }

  if (tag === "hmtx") {
    return isPlainRecord(data) ? hmtxDetailRows(data) : [];
  }

  if (BINARY_SUMMARY_TAGS.has(tag)) {
    return buildBinarySectionRows(tag, data, byteLength);
  }

  const rows: RawDisplayRow[] = [];
  flattenTableRows(tag, data, rows);
  return rows;
}

export function buildRawTableInventory(
  font: FontkitFont
): RawTableInventoryEntry[] {
  return getRawTableTags(font).map((tag) => ({
    tag,
    byteLength: getTableByteLength(font, tag) ?? 0,
    description: describeTableTag(tag),
    parsed: getRawTableData(font, tag) !== null,
  }));
}

export function buildRawTableSections(font: FontkitFont): RawTableSection[] {
  const sections: RawTableSection[] = [];
  const tags = getRawTableTags(font);

  if (tags.includes("name")) {
    const byteLength = getTableByteLength(font, "name");
    const data = getRawTableData(font, "name");
    const rows = buildTableSectionRows("name", font, data, byteLength);
    if (rows.length > 0) {
      sections.push({
        tag: "name",
        byteLength: byteLength ?? 0,
        description: describeTableTag("name"),
        parsed: data !== null,
        rows,
      });
    }
  }

  for (const tag of getOrderedTableTags(font)) {
    const byteLength = getTableByteLength(font, tag);
    const data = getRawTableData(font, tag);
    sections.push({
      tag,
      byteLength: byteLength ?? 0,
      description: describeTableTag(tag),
      parsed: data !== null,
      rows: buildTableSectionRows(tag, font, data, byteLength),
    });
  }

  return sections;
}

/** @deprecated Use {@link buildRawTableSections} for grouped, expandable table views. */
export function buildRawDisplayColumns(font: FontkitFont): {
  inventory: RawTableInventoryEntry[];
  left: RawDisplayRow[];
  right: RawDisplayRow[];
} {
  const sections = buildRawTableSections(font);
  const inventory = sections.map(
    ({ byteLength, description, parsed, tag }) => ({
      byteLength,
      description,
      parsed,
      tag,
    })
  );
  const left = sections.find((section) => section.tag === "name")?.rows ?? [];
  const right = sections
    .filter((section) => section.tag !== "name")
    .flatMap((section) => section.rows);

  return { inventory, left, right };
}

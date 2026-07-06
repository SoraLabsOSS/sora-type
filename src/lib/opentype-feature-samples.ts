import type { Font as FontkitFont } from "fontkit";

interface GsubCoverage {
  glyphs?: number[];
  rangeRecords?: { end: number; start: number }[];
}

interface GsubLigature {
  components: number[];
}

interface GsubSubtable {
  alternateSet?: { get(index: number): number[] };
  coverage?: GsubCoverage;
  deltaGlyphID?: number;
  extension?: GsubSubtable;
  ligatureSets?: { get(index: number): GsubLigature[] };
  sequences?: unknown;
  substitute?: unknown;
}

interface GsubLookup {
  subTables: GsubSubtable[];
}

interface GsubFeatureListEntry {
  feature: { lookupListIndexes: number[] };
  tag: string;
}

interface GsubTable {
  featureList: GsubFeatureListEntry[];
  lookupList: { get(index: number): GsubLookup | undefined };
}

const MAX_SAMPLES_PER_FEATURE = 20;

function coverageGlyphs(coverage: GsubCoverage): number[] {
  if (coverage.glyphs) {
    return coverage.glyphs;
  }
  const glyphs: number[] = [];
  for (const range of coverage.rangeRecords ?? []) {
    for (let glyph = range.start; glyph <= range.end; glyph++) {
      glyphs.push(glyph);
    }
  }
  return glyphs;
}

function buildGlyphToCharMap(font: FontkitFont): Map<number, string> {
  const map = new Map<number, string>();
  for (const codePoint of font.characterSet) {
    const glyph = font.glyphForCodePoint(codePoint);
    if (glyph && !map.has(glyph.id)) {
      map.set(glyph.id, String.fromCodePoint(codePoint));
    }
  }
  return map;
}

function isSimpleSubstitution(subtable: GsubSubtable): boolean {
  return Boolean(
    subtable.substitute ||
      subtable.deltaGlyphID !== undefined ||
      subtable.sequences ||
      subtable.alternateSet
  );
}

function collectLigatureSamples(
  glyphs: number[],
  ligatureSets: NonNullable<GsubSubtable["ligatureSets"]>,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  for (let index = 0; index < glyphs.length; index++) {
    const firstChar = charFor.get(glyphs[index]);
    if (!firstChar) {
      continue;
    }
    for (const ligature of ligatureSets.get(index) ?? []) {
      const rest = ligature.components.map((g) => charFor.get(g));
      if (rest.every((c): c is string => Boolean(c))) {
        samples.add(firstChar + rest.join(""));
      }
      if (samples.size >= MAX_SAMPLES_PER_FEATURE) {
        return;
      }
    }
  }
}

function collectSimpleSamples(
  glyphs: number[],
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  for (const glyph of glyphs) {
    const char = charFor.get(glyph);
    if (char) {
      samples.add(char);
    }
    if (samples.size >= MAX_SAMPLES_PER_FEATURE) {
      return;
    }
  }
}

function collectSamples(
  subtable: GsubSubtable,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  // Lookup type 7 (Extension Substitution) wraps the real subtable.
  const resolved = subtable.extension ?? subtable;
  const coverage = resolved.coverage;
  if (!coverage) {
    return;
  }
  const glyphs = coverageGlyphs(coverage);

  if (resolved.ligatureSets) {
    collectLigatureSamples(glyphs, resolved.ligatureSets, charFor, samples);
    return;
  }

  // Single (format 1/2), multiple, and alternate substitutions all key off
  // the same input coverage glyphs — a "which characters trigger this"
  // sample only needs the input side, not what it becomes.
  if (isSimpleSubstitution(resolved)) {
    collectSimpleSamples(glyphs, charFor, samples);
  }
}

// Fraction features are driven by contextual (chaining) lookups this reader
// doesn't parse, so they'd otherwise come up empty — hardcoded fallback text
// for `frac`. Uses the actual Unicode FRACTION SLASH (U+2044, "⁄") rather
// than the ASCII "/" — contextual rules (and e.g. fontkit's own shaper) key
// specifically off that codepoint, so a plain slash often won't trigger anything.
const FRACTION_SLASH = "⁄";
const FRACTION_SAMPLE = `1${FRACTION_SLASH}2 3${FRACTION_SLASH}4 5${FRACTION_SLASH}6 7${FRACTION_SLASH}8`;
const CONTEXTUAL_FEATURE_FALLBACKS: Record<string, string> = {
  afrc: FRACTION_SAMPLE,
  dnom: FRACTION_SAMPLE,
  frac: FRACTION_SAMPLE,
  numr: FRACTION_SAMPLE,
};

function findGsubSamples(
  gsub: GsubTable,
  charFor: Map<number, string>,
  tag: string
): string | null {
  const samples = new Set<string>();
  for (const entry of gsub.featureList) {
    if (entry.tag !== tag) {
      continue;
    }
    for (const lookupIndex of entry.feature.lookupListIndexes) {
      const lookup = gsub.lookupList.get(lookupIndex);
      for (const subtable of lookup?.subTables ?? []) {
        collectSamples(subtable, charFor, samples);
        if (samples.size >= MAX_SAMPLES_PER_FEATURE) {
          break;
        }
      }
    }
  }
  return samples.size > 0 ? [...samples].join(" ") : null;
}

/**
 * Builds a lazy lookup from OpenType feature tag to the actual characters in
 * this font affected by that feature's GSUB lookups, so a feature demo can
 * show real trigger characters instead of requiring the user to guess which
 * ones to type. Only handles substitution lookup types 1 (single), 2/3
 * (multiple/alternate), and 4 (ligature); contextual/chaining lookups
 * (types 5/6 — e.g. most fraction features) fall back to a hardcoded sample.
 */
export function createFeatureSampleFinder(
  font: FontkitFont
): (tag: string) => string | null {
  const gsub = (font as FontkitFont & { GSUB?: GsubTable }).GSUB;
  const charFor = gsub ? buildGlyphToCharMap(font) : null;

  return (tag: string): string | null => {
    const found = gsub && charFor ? findGsubSamples(gsub, charFor, tag) : null;
    return found ?? CONTEXTUAL_FEATURE_FALLBACKS[tag] ?? null;
  };
}

import type { Font as FontkitFont } from "fontkit";

interface GsubCoverage {
  glyphs?: number[];
  rangeRecords?: { end: number; start: number }[];
}

interface GsubLigature {
  components: number[];
}

interface GsubClassDef {
  classRangeRecord?: { class: number; end: number; start: number }[];
  classValueArray?: number[];
  glyphCount?: number;
  startGlyph?: number;
}

interface GsubChainRule {
  backtrack: number[];
  input: number[];
  lookahead: number[];
}

// `chainRuleSets`/`chainClassSet` and each of their entries are plain
// `r.Array`s in fontkit (unlike `alternateSet`/`ligatureSets`, which are
// `r.LazyArray`s needing `.get()`) — so this is a plain nested array.
type GsubChainRuleSets = GsubChainRule[][];

interface GsubChainingContext {
  backtrackClassDef?: GsubClassDef;
  backtrackCoverage?: GsubCoverage[];
  chainClassSet?: GsubChainRuleSets;
  chainRuleSets?: GsubChainRuleSets;
  coverage?: GsubCoverage;
  inputClassDef?: GsubClassDef;
  inputCoverage?: GsubCoverage[];
  lookaheadClassDef?: GsubClassDef;
  lookaheadCoverage?: GsubCoverage[];
  version?: number;
}

interface GsubSubtable {
  alternateSet?: { get(index: number): number[] };
  backtrackClassDef?: GsubClassDef;
  backtrackCoverage?: GsubCoverage[];
  chainClassSet?: GsubChainRuleSets;
  chainRuleSets?: GsubChainRuleSets;
  coverage?: GsubCoverage;
  deltaGlyphID?: number;
  extension?: GsubSubtable;
  inputClassDef?: GsubClassDef;
  inputCoverage?: GsubCoverage[];
  ligatureSets?: { get(index: number): GsubLigature[] };
  lookaheadClassDef?: GsubClassDef;
  lookaheadCoverage?: GsubCoverage[];
  sequences?: unknown;
  substitute?: unknown;
  version?: number;
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
// Caps each of backtrack/input/lookahead before pairing them up into demo
// strings — a few representative combinations are plenty for a live-typing
// demo box, and this is what actually prevents the combinatorial blow-up
// (e.g. 20 backtrack x 20 input x 20 lookahead = 8000 combinations) that the
// reference engine guards against with its own capacity/display caps.
const MAX_CONTEXTUAL_COMBINATIONS = 5;

// Latin letter blocks (basic + accented). `DEFAULT_DEMO_TEXT` in the compare
// UI is a Latin pangram, so when a feature's coverage spans multiple scripts
// (e.g. `smcp` on a font with both Cyrillic and Latin small caps), prefer
// collecting the Latin-script glyphs first — otherwise fonts whose glyph
// order lists another script before Latin end up capped at
// `MAX_SAMPLES_PER_FEATURE` before a single Latin sample is ever reached,
// and the demo shows a script the rest of the UI never uses.
const LATIN_CODE_POINT_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00_41, 0x00_5a], // A-Z
  [0x00_61, 0x00_7a], // a-z
  [0x00_c0, 0x00_ff], // Latin-1 Supplement letters
  [0x01_00, 0x02_4f], // Latin Extended-A/B
];

function isLatinSample(sample: string): boolean {
  const codePoint = sample.codePointAt(0) ?? 0;
  return LATIN_CODE_POINT_RANGES.some(
    ([start, end]) => codePoint >= start && codePoint <= end
  );
}

/** Positions of Latin-mapped glyphs first, then the rest, each in their
 * original relative order — so capping at `MAX_SAMPLES_PER_FEATURE` favors
 * Latin samples without dropping other scripts when a font has no Latin
 * coverage for a feature. Returns *indices into `glyphs`* rather than the
 * glyph IDs themselves, so callers that need to correlate a position back to
 * other per-index data (e.g. `ligatureSets`) don't have to round-trip
 * through a glyph-ID-keyed map — coverage glyph IDs are supposed to be
 * unique per the OpenType spec, but a malformed/hand-edited upload could
 * violate that, and keying by ID would silently drop or misalign entries. */
function prioritizeLatinIndices(
  glyphs: number[],
  charFor: Map<number, string>
): number[] {
  const latin: number[] = [];
  const rest: number[] = [];
  glyphs.forEach((glyph, index) => {
    const char = charFor.get(glyph);
    (char && isLatinSample(char) ? latin : rest).push(index);
  });
  return [...latin, ...rest];
}

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
  // `ligatureSets` is indexed by position in the original (unsorted)
  // coverage list, so reorder positions rather than glyph IDs — see
  // `prioritizeLatinIndices` for why.
  for (const index of prioritizeLatinIndices(glyphs, charFor)) {
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
  for (const index of prioritizeLatinIndices(glyphs, charFor)) {
    const char = charFor.get(glyphs[index]);
    if (char) {
      samples.add(char);
    }
    if (samples.size >= MAX_SAMPLES_PER_FEATURE) {
      return;
    }
  }
}

/** Every glyph a ClassDef assigns to a nonzero class — used as a coarse
 * "pool" of glyphs relevant to a class-based chaining rule (format 2).
 * Mirrors the reference engine's own simplification: it doesn't try to
 * match specific rules to specific classes, just reports which glyphs are
 * classified at all. */
function glyphsFromClassDef(classDef: GsubClassDef | undefined): number[] {
  if (!classDef) {
    return [];
  }
  if (classDef.classValueArray) {
    const start = classDef.startGlyph ?? 0;
    return classDef.classValueArray
      .map((value, index) => (value > 0 ? start + index : null))
      .filter((glyph): glyph is number => glyph !== null);
  }
  const glyphs: number[] = [];
  for (const record of classDef.classRangeRecord ?? []) {
    for (let glyph = record.start; glyph <= record.end; glyph++) {
      glyphs.push(glyph);
    }
  }
  return glyphs;
}

function charsFor(
  glyphs: number[],
  charFor: Map<number, string>,
  limit: number
): string[] {
  const chars: string[] = [];
  for (const glyph of glyphs) {
    const char = charFor.get(glyph);
    if (char) {
      chars.push(char);
      if (chars.length >= limit) {
        break;
      }
    }
  }
  return chars;
}

/** Pairs up (capped) backtrack/input/lookahead character pools into a
 * handful of concrete demo strings, e.g. "T A" for a rule that only fires
 * with a lookahead, or "fiT" for one needing both context sides. */
function addContextualCombinations(
  inputChars: string[],
  backtrackChars: string[],
  lookaheadChars: string[],
  samples: Set<string>
): void {
  const inputs = inputChars.slice(0, MAX_CONTEXTUAL_COMBINATIONS);
  const backtracks = backtrackChars.slice(0, MAX_CONTEXTUAL_COMBINATIONS);
  const lookaheads = lookaheadChars.slice(0, MAX_CONTEXTUAL_COMBINATIONS);

  if (backtracks.length === 0 && lookaheads.length === 0) {
    for (const input of inputs) {
      samples.add(input);
    }
    return;
  }

  const prefixes = backtracks.length > 0 ? backtracks : [""];
  const suffixes = lookaheads.length > 0 ? lookaheads : [""];

  outer: for (const prefix of prefixes) {
    for (const input of inputs) {
      for (const suffix of suffixes) {
        samples.add(`${prefix}${input}${suffix}`);
        if (samples.size >= MAX_SAMPLES_PER_FEATURE) {
          break outer;
        }
      }
    }
  }
}

/** Format 1 (glyph-based): `chainRuleSets` is parallel to `coverage` — the
 * i-th covered glyph is the rule's first input glyph, `rule.input` holds
 * the rest. */
function collectFormat1Samples(
  subtable: GsubChainingContext,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  const coverageGlyphIds = coverageGlyphs(subtable.coverage ?? {});
  coverageGlyphIds.forEach((firstGlyph, index) => {
    const rules = subtable.chainRuleSets?.[index];
    for (const rule of rules ?? []) {
      const inputChars = charsFor(
        [firstGlyph, ...rule.input],
        charFor,
        MAX_CONTEXTUAL_COMBINATIONS
      );
      const backtrackChars = charsFor(
        rule.backtrack,
        charFor,
        MAX_CONTEXTUAL_COMBINATIONS
      );
      const lookaheadChars = charsFor(
        rule.lookahead,
        charFor,
        MAX_CONTEXTUAL_COMBINATIONS
      );
      addContextualCombinations(
        inputChars,
        backtrackChars,
        lookaheadChars,
        samples
      );
    }
  });
}

/** Format 2 (class-based): treats every glyph assigned to any nonzero
 * input/backtrack/lookahead class as a flat "pool", same simplification the
 * reference engine uses — precise per-rule class matching isn't worth the
 * complexity for a demo sample. */
function collectFormat2Samples(
  subtable: GsubChainingContext,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  const inputChars = charsFor(
    glyphsFromClassDef(subtable.inputClassDef),
    charFor,
    MAX_SAMPLES_PER_FEATURE
  );
  const backtrackChars = charsFor(
    glyphsFromClassDef(subtable.backtrackClassDef),
    charFor,
    MAX_CONTEXTUAL_COMBINATIONS
  );
  const lookaheadChars = charsFor(
    glyphsFromClassDef(subtable.lookaheadClassDef),
    charFor,
    MAX_CONTEXTUAL_COMBINATIONS
  );
  addContextualCombinations(
    inputChars,
    backtrackChars,
    lookaheadChars,
    samples
  );
}

/** Format 3 (coverage-based): each position (backtrack/input/lookahead) is
 * its own flat Coverage table — no rule sets to walk. */
function collectFormat3Samples(
  subtable: GsubChainingContext,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  const inputChars = (subtable.inputCoverage ?? []).flatMap((coverage) =>
    charsFor(coverageGlyphs(coverage), charFor, MAX_CONTEXTUAL_COMBINATIONS)
  );
  const backtrackChars = (subtable.backtrackCoverage ?? []).flatMap(
    (coverage) =>
      charsFor(coverageGlyphs(coverage), charFor, MAX_CONTEXTUAL_COMBINATIONS)
  );
  const lookaheadChars = (subtable.lookaheadCoverage ?? []).flatMap(
    (coverage) =>
      charsFor(coverageGlyphs(coverage), charFor, MAX_CONTEXTUAL_COMBINATIONS)
  );
  addContextualCombinations(
    inputChars,
    backtrackChars,
    lookaheadChars,
    samples
  );
}

/** Lookup type 6 (Chained Contextual Substitution) — the mechanism behind
 * `calt`, `rlig`, `clig`, `jalt`, `rclt`, and often `frac`/`dnom`/`numr`.
 * Ported from the reference engine's `lookup-parsers/type6.js`, adapted to
 * fontkit's own field names (see `node_modules/fontkit/src/tables/opentype.js`,
 * `ChainingContext`). Deliberately doesn't build the full
 * backtrack x input x lookahead cross product — `addContextualCombinations`
 * caps each side before pairing, which is what actually prevents the
 * combinatorial blow-up a naive port would hit on real fonts.
 */
function collectChainingContextSamples(
  subtable: GsubChainingContext,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  if (subtable.version === 1) {
    collectFormat1Samples(subtable, charFor, samples);
  } else if (subtable.version === 2) {
    collectFormat2Samples(subtable, charFor, samples);
  } else if (subtable.version === 3) {
    collectFormat3Samples(subtable, charFor, samples);
  }
}

function collectSamples(
  subtable: GsubSubtable,
  charFor: Map<number, string>,
  samples: Set<string>
): void {
  // Lookup type 7 (Extension Substitution) wraps the real subtable.
  const resolved = subtable.extension ?? subtable;

  if (
    resolved.chainRuleSets ||
    resolved.chainClassSet ||
    resolved.inputCoverage
  ) {
    collectChainingContextSamples(resolved, charFor, samples);
    return;
  }

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
  if (samples.size === 0) {
    return null;
  }
  const all = [...samples];
  const latin = all.filter(isLatinSample);
  return (latin.length > 0 ? latin : all).join(" ");
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

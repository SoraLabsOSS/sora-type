import type { Font as FontkitFont } from "fontkit";

interface GsubAlternateSetList {
  get(index: number): { length: number } | undefined;
  length: number;
}

interface GsubSubtable {
  alternateSet?: GsubAlternateSetList;
  extension?: GsubSubtable;
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
  lookupList: { get(index: number): GsubLookup };
}

function maxAlternateCount(lookup: GsubLookup): number {
  let max = 0;
  for (const subtable of lookup.subTables) {
    // Lookup type 7 (Extension Substitution) wraps the real subtable.
    const resolved = subtable.alternateSet ? subtable : subtable.extension;
    const alternateSet = resolved?.alternateSet;
    if (!alternateSet) {
      continue;
    }
    // A LazyArray (like lookupList/ligatureSets elsewhere) — needs .get(),
    // not a for...of, which throws since it isn't a plain iterable.
    for (let index = 0; index < alternateSet.length; index++) {
      const set = alternateSet.get(index);
      if (set) {
        max = Math.max(max, set.length);
      }
    }
  }
  return max;
}

/**
 * Reads how many alternate glyphs (GSUB lookup type 3, Alternate
 * Substitution) each feature offers — e.g. a stylistic-alternate feature
 * that can pick between 3 variants of a glyph, not just on/off. Only
 * features with more than one alternate are returned; a plain on/off
 * feature has nothing meaningful to pick between.
 */
export function getFeatureAlternateCounts(
  font: FontkitFont
): Record<string, number> {
  const gsub = (font as FontkitFont & { GSUB?: GsubTable }).GSUB;
  if (!gsub) {
    return {};
  }

  // gsub.featureList has one entry per script/language combo, so the same
  // tag (e.g. "salt") can appear many times with different lookup subsets —
  // aggregate across all of them instead of keeping only the last entry's
  // count, which could under-report the max alternates available.
  const counts: Record<string, number> = {};
  for (const entry of gsub.featureList) {
    let entryMax = 0;
    for (const lookupIndex of entry.feature.lookupListIndexes) {
      const lookup = gsub.lookupList.get(lookupIndex);
      if (lookup) {
        entryMax = Math.max(entryMax, maxAlternateCount(lookup));
      }
    }
    if (entryMax > (counts[entry.tag] ?? 0)) {
      counts[entry.tag] = entryMax;
    }
  }

  for (const tag of Object.keys(counts)) {
    if (counts[tag] <= 1) {
      delete counts[tag];
    }
  }
  return counts;
}

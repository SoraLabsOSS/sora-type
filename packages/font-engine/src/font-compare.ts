import type { Font as FontkitFont } from "fontkit";
import {
  type LanguageSupportResult,
  reportAllLanguages,
} from "./font-language-detection";

export interface FontIdentity {
  fullName: string;
  id: string;
}

export interface ComparisonCell {
  missing: string[];
  support: LanguageSupportResult["support"];
}

export interface ComparisonLanguageRow {
  code: string;
  /** Unique key for this row, matching the corresponding key in each font's
   * `cells` map. Some language codes have multiple orthographies that share
   * a script (e.g. "kkj" has two Latin orthographies), so `code::script`
   * alone isn't always unique — this key disambiguates with an occurrence
   * index when needed. */
  key: string;
  name: string;
  script: string;
}

export interface ComparisonMatrix {
  cells: Record<
    string /* fontId */,
    Record<string /* row key */, ComparisonCell>
  >;
  fonts: FontIdentity[];
  languages: ComparisonLanguageRow[];
}

export interface ComparisonFontEntry {
  font: FontkitFont;
  fontData?: ArrayBuffer;
  fullName: string;
  id: string;
}

function makeRowKey(
  occurrences: Map<string, number>,
  code: string,
  script: string
): string {
  const base = `${code}::${script}`;
  const count = occurrences.get(base) ?? 0;
  occurrences.set(base, count + 1);
  return count === 0 ? base : `${base}::${count}`;
}

/**
 * Pivots per-font language-support results into a fonts × languages matrix.
 * Pure reshaping over `reportAllLanguages` — no new detection logic.
 */
export function buildComparisonMatrix(
  entries: ComparisonFontEntry[],
  options?: { languageCodes?: string[] }
): ComparisonMatrix {
  const codeFilter = options?.languageCodes
    ? new Set(options.languageCodes)
    : null;

  const fonts: FontIdentity[] = entries.map((e) => ({
    id: e.id,
    fullName: e.fullName,
  }));

  let languages: ComparisonLanguageRow[] | null = null;
  const cells: ComparisonMatrix["cells"] = {};

  for (const entry of entries) {
    const results = reportAllLanguages(entry.font, entry.fontData).filter(
      (r) => !codeFilter || codeFilter.has(r.code)
    );

    const occurrences = new Map<string, number>();
    const fontCells: Record<string, ComparisonCell> = {};
    const rows: ComparisonLanguageRow[] = [];

    for (const result of results) {
      const key = makeRowKey(occurrences, result.code, result.script);
      fontCells[key] = { support: result.support, missing: result.missing };
      rows.push({
        key,
        code: result.code,
        name: result.name,
        script: result.script,
      });
    }

    cells[entry.id] = fontCells;
    // Row order/keys are a pure function of the language database, so every
    // font produces the identical roster — capture it once.
    languages ??= rows;
  }

  return { fonts, languages: languages ?? [], cells };
}

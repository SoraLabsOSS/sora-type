import type { Font as FontkitFont } from "fontkit";
import languageDatabase from "@/data/languages.json";
import { checkMarkAttachment, createShapingFont } from "@/lib/font-shaping";

interface Orthography {
  base: number[];
  characters: string[];
  script: string;
  status: string;
}

interface LanguageEntry {
  name: string;
  orthographies: Orthography[];
}

const DATABASE = languageDatabase as Record<string, LanguageEntry>;

export type SupportLevel =
  | "full"
  | "decomposed"
  | "positioning-failed"
  | "none";

export interface LanguageSupportResult {
  code: string;
  missing: string[];
  name: string;
  script: string;
  status: string;
  support: SupportLevel;
  /** Characters whose glyphs are all present (directly or via decomposition)
   * but failed the HarfBuzz mark-attachment/positioning check. Distinct from
   * `missing`, where the glyphs themselves don't exist in the font. */
  unpositioned: string[];
}

function decomposedCodePoints(char: string): number[] {
  return Array.from(char.normalize("NFD")).map(
    (c) => c.codePointAt(0) as number
  );
}

/**
 * Checks a single orthography against a font, following the same three
 * tiers hyperglot's checker does:
 *  1. Direct coverage — every character's codepoint(s) exist in the font.
 *  2. Decomposed fallback — a missing precomposed character can still be
 *     typed via its base letter + combining marks, if the font has those.
 *  3. Shaping — for any character relying on tier 2 (or already authored as
 *     an unencoded base+mark sequence), confirm the font's GPOS actually
 *     positions the marks, via HarfBuzz shaping (not just cmap presence).
 */
function checkOrthography(
  orthography: Orthography,
  characterSet: Set<number>,
  hbFont: ReturnType<typeof createShapingFont> | null
): { missing: string[]; support: SupportLevel; unpositioned: string[] } {
  const missing: string[] = [];
  const unpositioned: string[] = [];
  let usedDecomposition = false;

  for (const char of orthography.characters) {
    const codePoints = Array.from(char).map((c) => c.codePointAt(0) as number);
    const directlyCovered = codePoints.every((cp) => characterSet.has(cp));
    const needsAttachmentCheck = codePoints.length > 1;

    if (directlyCovered && !needsAttachmentCheck) {
      continue;
    }

    if (!directlyCovered) {
      const decomposed = decomposedCodePoints(char);
      const decomposedCovered =
        decomposed.length > 1 && decomposed.every((cp) => characterSet.has(cp));
      if (!decomposedCovered) {
        missing.push(char);
        continue;
      }
      usedDecomposition = true;
    }

    // Either an unencoded base+mark sequence from the source data, or a
    // precomposed char we're only getting via decomposition — either way,
    // confirm the marks actually attach. The glyphs exist either way, so a
    // failure here is a positioning problem, not a coverage problem.
    if (hbFont && !checkMarkAttachment(hbFont, char)) {
      unpositioned.push(char);
    }
  }

  if (missing.length > 0) {
    return { missing, support: "none", unpositioned };
  }
  if (unpositioned.length > 0) {
    return { missing: [], support: "positioning-failed", unpositioned };
  }
  return {
    missing: [],
    support: usedDecomposition ? "decomposed" : "full",
    unpositioned: [],
  };
}

function checkAllOrthographies(
  characterSet: Set<number>,
  hbFont: ReturnType<typeof createShapingFont> | null
): LanguageSupportResult[] {
  const results: LanguageSupportResult[] = [];

  for (const [code, language] of Object.entries(DATABASE)) {
    for (const orthography of language.orthographies) {
      const { missing, support, unpositioned } = checkOrthography(
        orthography,
        characterSet,
        hbFont
      );
      results.push({
        code,
        name: language.name,
        script: orthography.script,
        status: orthography.status,
        support,
        missing,
        unpositioned,
      });
    }
  }

  return results;
}

/**
 * Returns only the languages/orthographies the font safely supports (full or
 * via decomposition + verified shaping) — for a FontDrop-style "Detected"
 * list. Orthographies where glyphs exist but marks fail to position
 * (`"positioning-failed"`) are excluded here since the font can't actually
 * render them correctly; use `reportAllLanguages` to see those too.
 *
 * `fontData` is required to run the shaping/mark-attachment check; pass the
 * same raw font bytes used to open `font` with fontkit. If omitted, tier 3
 * is skipped and results fall back to cmap-only coverage (like FontDrop) —
 * which will over-report support, since it can't see positioning failures.
 */
export function detectLanguages(
  font: FontkitFont,
  fontData?: ArrayBuffer
): LanguageSupportResult[] {
  const characterSet = new Set(font.characterSet);
  const hbFont = fontData ? createShapingFont(fontData) : null;
  return checkAllOrthographies(characterSet, hbFont).filter(
    (r) => r.support === "full" || r.support === "decomposed"
  );
}

/**
 * Returns every known language/orthography plus its support level and any
 * missing characters — for a "database" style view listing all languages.
 */
export function reportAllLanguages(
  font: FontkitFont,
  fontData?: ArrayBuffer
): LanguageSupportResult[] {
  const characterSet = new Set(font.characterSet);
  const hbFont = fontData ? createShapingFont(fontData) : null;
  return checkAllOrthographies(characterSet, hbFont);
}

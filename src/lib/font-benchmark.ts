import type { Font as FontkitFont } from "fontkit";
import {
  reportAllLanguages,
  type SupportLevel,
} from "@/lib/font-language-detection";

/** Vietnamese/Southeast Asian languages with diacritic- or combining-mark-
 * heavy orthographies — where a cmap-only check is most likely to diverge
 * from a shaping-verified one. Used as `compareAccuracy`'s default scope. */
const DEFAULT_SEA_LANGUAGE_CODES = [
  "vie",
  "tha",
  "khm",
  "lao",
  "mya",
  "shn",
  "mnw",
  "fil",
  "ceb",
];

export interface AccuracyComparisonResult {
  cmapOnlySupported: boolean;
  code: string;
  discrepancy: boolean;
  name: string;
  script: string;
  shapingVerifiedSupport: SupportLevel;
}

/**
 * Diffs a cmap-only check (what a FontDrop-style tool would report) against
 * this engine's full shaping-verified check, for the same font. Surfaces
 * `discrepancy: true` where cmap-only would claim support but the font
 * actually fails to position marks correctly — the concrete evidence for
 * sora-type's accuracy differentiator.
 */
export function compareAccuracy(
  font: FontkitFont,
  fontData: ArrayBuffer,
  languageCodes: string[] = DEFAULT_SEA_LANGUAGE_CODES
): AccuracyComparisonResult[] {
  const codeSet = new Set(languageCodes);
  const shapingVerified = reportAllLanguages(font, fontData).filter((r) =>
    codeSet.has(r.code)
  );
  const cmapOnly = reportAllLanguages(font).filter((r) => codeSet.has(r.code));

  // Both arrays come from iterating the same DATABASE with the same filter,
  // so they're guaranteed the same length and (code, script) order — some
  // languages (e.g. "kkj") have multiple orthographies sharing one script,
  // so a `code::script` map key would collide; zip by position instead.
  return shapingVerified.map((verified, i) => {
    const cmapResult = cmapOnly[i];
    const cmapOnlySupported =
      cmapResult?.support === "full" || cmapResult?.support === "decomposed";

    return {
      code: verified.code,
      name: verified.name,
      script: verified.script,
      cmapOnlySupported,
      shapingVerifiedSupport: verified.support,
      discrepancy: cmapOnlySupported && verified.support !== "full",
    };
  });
}

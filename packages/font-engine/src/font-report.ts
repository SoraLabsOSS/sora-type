import type { LanguageSupportResult } from "./font-language-detection";

export interface LanguageSupportSummary {
  decomposed: number;
  full: number;
  none: number;
  positioningFailed: number;
  total: number;
}

export function summarizeSupport(
  results: LanguageSupportResult[]
): LanguageSupportSummary {
  const summary: LanguageSupportSummary = {
    full: 0,
    decomposed: 0,
    positioningFailed: 0,
    none: 0,
    total: results.length,
  };

  for (const result of results) {
    if (result.support === "full") {
      summary.full++;
    } else if (result.support === "decomposed") {
      summary.decomposed++;
    } else if (result.support === "positioning-failed") {
      summary.positioningFailed++;
    } else {
      summary.none++;
    }
  }

  return summary;
}

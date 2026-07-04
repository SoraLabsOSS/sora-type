/**
 * Public API surface for sora-type's font-language detection engine.
 * Import from this barrel (not individual files) from the CLI, any future
 * API route, or a standalone package extraction — keeps one stable path
 * instead of reaching into individual modules.
 */

export type { AccuracyComparisonResult } from "@/lib/font-benchmark";
export { compareAccuracy } from "@/lib/font-benchmark";
export type {
  ComparisonCell,
  ComparisonFontEntry,
  ComparisonLanguageRow,
  ComparisonMatrix,
  FontIdentity,
} from "@/lib/font-compare";
export { buildComparisonMatrix } from "@/lib/font-compare";
export type {
  LanguageSupportResult,
  SupportLevel,
} from "@/lib/font-language-detection";
export {
  detectLanguages,
  reportAllLanguages,
} from "@/lib/font-language-detection";
export type { LanguageSupportSummary } from "@/lib/font-report";
export { summarizeSupport } from "@/lib/font-report";
export type { FontReport } from "@/lib/report-export";
export {
  buildFontReport,
  exportReportAsJson,
  exportReportAsPdf,
} from "@/lib/report-export";

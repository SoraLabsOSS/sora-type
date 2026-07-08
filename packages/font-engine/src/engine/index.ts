/**
 * Public API surface for sora-type's font-language detection engine.
 * Import from this barrel (not individual files) from the CLI, any future
 * API route, or a standalone package extraction — keeps one stable path
 * instead of reaching into individual modules.
 */

export type { AccuracyComparisonResult } from "../font-benchmark";
export { compareAccuracy } from "../font-benchmark";
export type {
  ComparisonCell,
  ComparisonFontEntry,
  ComparisonLanguageRow,
  ComparisonMatrix,
  FontIdentity,
} from "../font-compare";
export { buildComparisonMatrix } from "../font-compare";
export type {
  LanguageSupportResult,
  SupportLevel,
} from "../font-language-detection";
export {
  detectLanguages,
  reportAllLanguages,
} from "../font-language-detection";
export type {
  FontDetailField,
  FontEmbeddingPermissions,
  FontMetadata,
  FontMetricsSummary,
  FontVariationAxisSummary,
} from "../font-metadata";
export {
  buildFontDetailFields,
  extractFontMetadata,
  summarizeEmbedding,
} from "../font-metadata";
export type { LanguageSupportSummary } from "../font-report";
export { summarizeSupport } from "../font-report";
export type { FontReport } from "../report-export";
export {
  buildFontReport,
  exportReportAsJson,
  exportReportAsPdf,
} from "../report-export";

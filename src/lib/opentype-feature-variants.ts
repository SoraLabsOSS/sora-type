/**
 * Native CSS `font-variant-*` equivalents for OpenType feature tags — used
 * to prefer a standard CSS property over raw `font-feature-settings` when
 * one exists, with a `font-feature-settings` fallback for older browsers.
 *
 * Ported from Wakamai Fondue's `layout-features.js` (Google LLC, Apache
 * License 2.0 — https://github.com/Wakamai-Fondue/wakamai-fondue-engine).
 * Trimmed to tag -> variant declaration only.
 */
const FEATURE_VARIANT_CSS: Record<string, string> = {
  afrc: "font-variant-numeric: stacked-fractions",
  calt: "font-variant-ligatures: contextual",
  clig: "font-variant-ligatures: contextual",
  dlig: "font-variant-ligatures: discretionary-ligatures",
  frac: "font-variant-numeric: diagonal-fractions",
  fwid: "font-variant-east-asian: full-width",
  hist: "font-variant-alternates: historical-forms",
  hlig: "font-variant-ligatures: historical-ligatures",
  hwid: "font-variant-east-asian: half-width",
  jp04: "font-variant-east-asian: jis04",
  jp78: "font-variant-east-asian: jis78",
  jp83: "font-variant-east-asian: jis83",
  jp90: "font-variant-east-asian: jis90",
  liga: "font-variant-ligatures: common-ligatures",
  lnum: "font-variant-numeric: lining-nums",
  onum: "font-variant-numeric: oldstyle-nums",
  ordn: "font-variant-numeric: ordinal",
  pcap: "font-variant-caps: petite-caps",
  pnum: "font-variant-numeric: proportional-nums",
  pwid: "font-variant-east-asian: proportional-width",
  ruby: "font-variant-east-asian: ruby",
  smcp: "font-variant-caps: small-caps",
  smpl: "font-variant-east-asian: simplified",
  subs: "font-variant-position: sub",
  sups: "font-variant-position: super",
  titl: "font-variant-caps: titling-caps",
  tnum: "font-variant-numeric: tabular-nums",
  trad: "font-variant-east-asian: traditional",
  unic: "font-variant-caps: unicase",
  zero: "font-variant-numeric: slashed-zero",
};

/** The native `font-variant-*` declaration for a tag, if one exists. */
export function getFeatureVariantCss(tag: string): string | null {
  return FEATURE_VARIANT_CSS[tag] ?? null;
}

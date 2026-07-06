/**
 * Classifies OpenType layout feature tags as:
 * - "fixed": on by default, not meant to be user-toggled (glyph
 *   pre-processing / complex-script shaping the engine always applies)
 * - "on": on by default, user can turn off (e.g. kerning, ligatures)
 * - "off": off by default, user can turn on (stylistic/optional features)
 *
 * Ported from Wakamai Fondue's `layout-features.js` (Google LLC, Apache
 * License 2.0 — https://github.com/Wakamai-Fondue/wakamai-fondue-engine),
 * itself based on "Enabling Typography: towards a general model of OpenType
 * Layout" by John Hudson, Tiro Typeworks. Trimmed to tag -> state only.
 */
export type OpenTypeFeatureState = "fixed" | "off" | "on";

const FEATURE_STATE: Record<string, OpenTypeFeatureState> = {
  aalt: "off",
  abvf: "fixed",
  abvm: "fixed",
  abvs: "fixed",
  afrc: "off",
  akhn: "fixed",
  blwf: "fixed",
  blwm: "fixed",
  blws: "fixed",
  c2pc: "off",
  c2sc: "off",
  calt: "on",
  case: "off",
  ccmp: "fixed",
  cfar: "fixed",
  cjct: "fixed",
  clig: "on",
  cpct: "off",
  cpsp: "off",
  cswh: "off",
  curs: "fixed",
  "cv##": "off",
  dist: "fixed",
  dlig: "off",
  dnom: "off",
  expt: "off",
  falt: "off",
  fin2: "fixed",
  fin3: "fixed",
  fina: "fixed",
  frac: "off",
  fwid: "off",
  haln: "fixed",
  half: "fixed",
  halt: "off",
  hist: "off",
  hkna: "off",
  hlig: "off",
  hngl: "fixed",
  hojo: "fixed",
  hwid: "off",
  init: "fixed",
  isol: "fixed",
  ital: "off",
  jalt: "on",
  jp04: "fixed",
  jp78: "fixed",
  jp83: "fixed",
  jp90: "fixed",
  kern: "on",
  lfbd: "off",
  liga: "on",
  ljmo: "fixed",
  lnum: "off",
  locl: "fixed",
  ltra: "fixed",
  ltrm: "fixed",
  mark: "fixed",
  med2: "fixed",
  medi: "fixed",
  mgrk: "off",
  mkmk: "fixed",
  mset: "fixed",
  nalt: "off",
  nlck: "fixed",
  nukt: "fixed",
  numr: "off",
  onum: "off",
  opbd: "off",
  ordn: "off",
  ornm: "off",
  palt: "off",
  pcap: "off",
  pkna: "off",
  pnum: "off",
  pref: "fixed",
  pres: "fixed",
  pstf: "fixed",
  psts: "fixed",
  pwid: "off",
  qwid: "off",
  rand: "on",
  rclt: "fixed",
  rkrf: "fixed",
  rlig: "fixed",
  rphf: "fixed",
  rtbd: "off",
  rtla: "fixed",
  rtlm: "fixed",
  ruby: "off",
  rvrn: "fixed",
  salt: "off",
  sinf: "off",
  size: "off",
  smcp: "off",
  smpl: "fixed",
  "ss##": "off",
  stch: "fixed",
  subs: "off",
  sups: "off",
  swsh: "off",
  titl: "off",
  tjmo: "fixed",
  tnam: "fixed",
  tnum: "off",
  trad: "fixed",
  twid: "off",
  unic: "off",
  valt: "fixed",
  vatu: "fixed",
  vert: "fixed",
  vhal: "off",
  vjmo: "fixed",
  vkna: "off",
  vkrn: "on",
  vpal: "off",
  vrt2: "fixed",
  zero: "off",
};

const STYLISTIC_SET_PATTERN = /^ss\d\d$/;
const CHARACTER_VARIANT_PATTERN = /^cv\d\d$/;

/** Classifies a tag as fixed/on/off — same rules `isToggleableFeature` uses. */
export function getFeatureState(tag: string): OpenTypeFeatureState {
  if (STYLISTIC_SET_PATTERN.test(tag)) {
    return FEATURE_STATE["ss##"];
  }
  if (CHARACTER_VARIANT_PATTERN.test(tag)) {
    return FEATURE_STATE["cv##"];
  }
  return FEATURE_STATE[tag] ?? "off";
}

/** Whether a feature is meant to be user-toggleable, vs. always applied by the shaping engine. */
export function isToggleableFeature(tag: string): boolean {
  return getFeatureState(tag) !== "fixed";
}

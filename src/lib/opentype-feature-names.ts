/**
 * Human-readable names for registered OpenType layout feature tags, per the
 * public spec (https://learn.microsoft.com/typography/opentype/spec/featurelist).
 * Falls back to the raw tag for anything not in this table (private/rare tags).
 */
const OPENTYPE_FEATURE_NAMES: Record<string, string> = {
  aalt: "Access All Alternates",
  afrc: "Alternative Fractions",
  calt: "Contextual Alternates",
  case: "Case-Sensitive Forms",
  ccmp: "Glyph Composition/Decomposition",
  clig: "Contextual Ligatures",
  cpsp: "Capital Spacing",
  cswh: "Contextual Swash",
  curs: "Cursive Positioning",
  c2pc: "Petite Capitals From Capitals",
  c2sc: "Small Capitals From Capitals",
  dlig: "Discretionary Ligatures",
  dnom: "Denominators",
  dtls: "Dotless Forms",
  expt: "Expert Forms",
  falt: "Final Glyph on Line Alternates",
  fina: "Terminal Forms",
  frac: "Fractions",
  fwid: "Full Widths",
  half: "Half Forms",
  haln: "Halant Forms",
  halt: "Alternate Half Widths",
  hist: "Historical Forms",
  hkna: "Horizontal Kana Alternates",
  hlig: "Historical Ligatures",
  hwid: "Half Widths",
  init: "Initial Forms",
  isol: "Isolated Forms",
  ital: "Italics",
  jalt: "Justification Alternates",
  kern: "Kerning",
  liga: "Standard Ligatures",
  lnum: "Lining Figures",
  locl: "Localized Forms",
  mark: "Mark Positioning",
  medi: "Medial Forms",
  mgrk: "Mathematical Greek",
  mkmk: "Mark to Mark Positioning",
  nalt: "Alternate Annotation Forms",
  nukt: "Nukta Forms",
  numr: "Numerators",
  onum: "Oldstyle Figures",
  opbd: "Optical Bounds",
  ordn: "Ordinals",
  ornm: "Ornaments",
  palt: "Proportional Alternate Widths",
  pcap: "Petite Capitals",
  pkna: "Proportional Kana",
  pnum: "Proportional Figures",
  pwid: "Proportional Widths",
  qwid: "Quarter Widths",
  rand: "Randomize",
  rclt: "Required Contextual Alternates",
  rlig: "Required Ligatures",
  rtla: "Right-to-left Alternates",
  rtlm: "Right-to-left Mirrored Forms",
  ruby: "Ruby Notation Forms",
  rvrn: "Required Variation Alternates",
  salt: "Stylistic Alternates",
  sinf: "Scientific Inferiors",
  size: "Optical Size",
  smcp: "Small Capitals",
  smpl: "Simplified Forms",
  ssty: "Math Script-style Alternates",
  stch: "Stretching Glyph Decomposition",
  subs: "Subscript",
  sups: "Superscript",
  swsh: "Swash",
  titl: "Titling",
  tnum: "Tabular Figures",
  trad: "Traditional Forms",
  twid: "Third Widths",
  unic: "Unicase",
  valt: "Alternate Vertical Metrics",
  vert: "Vertical Alternates and Rotation",
  zero: "Slashed Zero",
};

for (let n = 1; n <= 20; n++) {
  OPENTYPE_FEATURE_NAMES[`ss${String(n).padStart(2, "0")}`] =
    `Stylistic Set ${n}`;
}

export function getOpenTypeFeatureName(tag: string): string {
  return OPENTYPE_FEATURE_NAMES[tag] ?? tag;
}

interface GsubFeatureParams {
  nameID: number;
}

interface GsubFeatureListEntry {
  feature: { featureParams?: GsubFeatureParams | null };
  tag: string;
}

interface GsubTable {
  featureList: GsubFeatureListEntry[];
}

interface FontWithNameTable {
  GSUB?: GsubTable;
  name?: {
    records?: {
      fontFeatures?: Record<number, Record<string, string>>;
    };
  };
}

/**
 * A font can override the display name of a numbered feature (`ss01`,
 * `cv03`, ...) via its `FeatureParams.nameID` — a "UI Name ID" (spec range
 * 256+) resolved through the `name` table, e.g. "Alternate Numerals" instead
 * of the generic "Character Variant 3". Falls back to `null` (callers should
 * then use `getOpenTypeFeatureName`) when the font doesn't set one.
 */
export function getFeatureUiName(
  font: import("fontkit").Font,
  tag: string
): string | null {
  const { GSUB, name } = font as unknown as FontWithNameTable;
  const nameID = GSUB?.featureList.find(
    (entry) => entry.tag === tag && entry.feature.featureParams
  )?.feature.featureParams?.nameID;
  if (nameID === undefined) {
    return null;
  }

  const names = name?.records?.fontFeatures?.[nameID];
  if (!names) {
    return null;
  }
  return names.en ?? Object.values(names)[0] ?? null;
}

/**
 * Classifies codepoints into a 3-tier taxonomy (category -> subCategory ->
 * script) using native Unicode property escapes (`\p{General_Category=...}`,
 * `\p{Script=...}`) — no external glyph-name dataset required.
 */

export type GlyphCategory =
  | "Letter"
  | "Mark"
  | "Number"
  | "Other"
  | "Punctuation"
  | "Separator"
  | "Symbol";

export interface GlyphClassification {
  category: GlyphCategory;
  script: string | null;
  subCategory: string;
}

export const GLYPH_CATEGORY_ORDER: GlyphCategory[] = [
  "Letter",
  "Number",
  "Punctuation",
  "Symbol",
  "Mark",
  "Separator",
  "Other",
];

export const GLYPH_SUBCATEGORY_ORDER: Record<GlyphCategory, string[]> = {
  Letter: ["Uppercase", "Lowercase", "Titlecase", "Modifier", "Other"],
  Number: ["Decimal Digit", "Letter Number", "Other"],
  Punctuation: [
    "Open",
    "Close",
    "Initial Quote",
    "Final Quote",
    "Dash",
    "Connector",
    "Other",
  ],
  Symbol: ["Currency", "Math", "Modifier", "Other"],
  Mark: ["Nonspacing", "Spacing Combining", "Enclosing"],
  Separator: ["Space", "Line", "Paragraph"],
  Other: ["Control", "Format", "Private Use", "Surrogate", "Unassigned"],
};

// Maps 2-letter Unicode General_Category values to category + subCategory.
const GENERAL_CATEGORY_MAP: Record<
  string,
  { category: GlyphCategory; subCategory: string }
> = {
  Cc: { category: "Other", subCategory: "Control" },
  Cf: { category: "Other", subCategory: "Format" },
  Cn: { category: "Other", subCategory: "Unassigned" },
  Co: { category: "Other", subCategory: "Private Use" },
  Cs: { category: "Other", subCategory: "Surrogate" },
  Lu: { category: "Letter", subCategory: "Uppercase" },
  Ll: { category: "Letter", subCategory: "Lowercase" },
  Lt: { category: "Letter", subCategory: "Titlecase" },
  Lm: { category: "Letter", subCategory: "Modifier" },
  Lo: { category: "Letter", subCategory: "Other" },
  Mn: { category: "Mark", subCategory: "Nonspacing" },
  Mc: { category: "Mark", subCategory: "Spacing Combining" },
  Me: { category: "Mark", subCategory: "Enclosing" },
  Nd: { category: "Number", subCategory: "Decimal Digit" },
  Nl: { category: "Number", subCategory: "Letter Number" },
  No: { category: "Number", subCategory: "Other" },
  Pc: { category: "Punctuation", subCategory: "Connector" },
  Pd: { category: "Punctuation", subCategory: "Dash" },
  Ps: { category: "Punctuation", subCategory: "Open" },
  Pe: { category: "Punctuation", subCategory: "Close" },
  Pi: { category: "Punctuation", subCategory: "Initial Quote" },
  Pf: { category: "Punctuation", subCategory: "Final Quote" },
  Po: { category: "Punctuation", subCategory: "Other" },
  Sm: { category: "Symbol", subCategory: "Math" },
  Sc: { category: "Symbol", subCategory: "Currency" },
  Sk: { category: "Symbol", subCategory: "Modifier" },
  So: { category: "Symbol", subCategory: "Other" },
  Zs: { category: "Separator", subCategory: "Space" },
  Zl: { category: "Separator", subCategory: "Line" },
  Zp: { category: "Separator", subCategory: "Paragraph" },
};

const GENERAL_CATEGORY_PATTERNS = Object.entries(GENERAL_CATEGORY_MAP).map(
  ([code, info]) =>
    [new RegExp(`\\p{General_Category=${code}}`, "u"), info] as const
);

// Scripts common enough in real-world fonts to be worth a dedicated group.
// Anything else (or a Letter/Mark in "Common"/"Inherited", e.g. combining
// diacritics shared across scripts) is left ungrouped by script.
const GROUPABLE_SCRIPTS = [
  "Latin",
  "Greek",
  "Cyrillic",
  "Armenian",
  "Hebrew",
  "Arabic",
  "Syriac",
  "Thaana",
  "Devanagari",
  "Bengali",
  "Gurmukhi",
  "Gujarati",
  "Oriya",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Sinhala",
  "Thai",
  "Lao",
  "Tibetan",
  "Myanmar",
  "Georgian",
  "Hangul",
  "Ethiopic",
  "Cherokee",
  "Canadian_Aboriginal",
  "Ogham",
  "Runic",
  "Khmer",
  "Mongolian",
  "Hiragana",
  "Katakana",
  "Bopomofo",
  "Han",
  "Yi",
  "Old_Italic",
  "Gothic",
  "Deseret",
  "Glagolitic",
  "Coptic",
  "Tifinagh",
  "Nko",
  "Vai",
  "Bamum",
  "Balinese",
  "Cham",
  "Adlam",
  "Osage",
];

const SCRIPT_PATTERNS = GROUPABLE_SCRIPTS.map(
  (script) => [new RegExp(`\\p{Script=${script}}`, "u"), script] as const
);

function classifyGeneralCategory(char: string): {
  category: GlyphCategory;
  subCategory: string;
} {
  for (const [pattern, info] of GENERAL_CATEGORY_PATTERNS) {
    if (pattern.test(char)) {
      return info;
    }
  }
  return { category: "Other", subCategory: "Unassigned" };
}

function detectScript(char: string): string | null {
  for (const [pattern, script] of SCRIPT_PATTERNS) {
    if (pattern.test(char)) {
      return script;
    }
  }
  return null;
}

export function classifyCodePoint(codePoint: number): GlyphClassification {
  const char = String.fromCodePoint(codePoint);
  const { category, subCategory } = classifyGeneralCategory(char);
  // Script-level grouping only reads meaningfully for letters/marks — most
  // digits, punctuation, and symbols are "Common" across scripts.
  const script =
    category === "Letter" || category === "Mark" ? detectScript(char) : null;
  return { category, script, subCategory };
}

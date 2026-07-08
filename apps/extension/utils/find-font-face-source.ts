export interface FontFaceSource {
  url: string;
}

const URL_PATTERN = /url\(\s*(['"]?)([^'")]+)\1\s*\)/i;

function normalizeFamilyName(name: string): string {
  return name
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase();
}

function resolveUrl(rawUrl: string, sheet: CSSStyleSheet): string | null {
  try {
    return new URL(rawUrl, sheet.href ?? document.baseURI).href;
  } catch {
    return null;
  }
}

function findInSheet(
  sheet: CSSStyleSheet,
  family: string
): FontFaceSource | null {
  let rules: CSSRuleList;
  try {
    // Throws SecurityError for cross-origin stylesheets without CORS
    // headers on the stylesheet itself (independent of the font file's
    // own CORS status).
    rules = sheet.cssRules;
  } catch {
    return null;
  }

  for (const rule of rules) {
    if (!(rule instanceof CSSFontFaceRule)) {
      continue;
    }
    const ruleFamily = rule.style.getPropertyValue("font-family");
    if (normalizeFamilyName(ruleFamily) !== family) {
      continue;
    }
    const src = rule.style.getPropertyValue("src");
    const match = src.match(URL_PATTERN);
    if (!match) {
      continue;
    }
    const url = resolveUrl(match[2], sheet);
    if (url) {
      return { url };
    }
  }

  return null;
}

/**
 * Finds the `@font-face` rule matching `family` (as returned by
 * `detectRenderedFont`) and resolves its `src: url(...)` to an absolute
 * URL. Returns `null` for system fonts (no `@font-face` at all) or when
 * every candidate stylesheet is unreadable/cross-origin-blocked.
 */
export function findFontFaceSource(family: string): FontFaceSource | null {
  const normalized = normalizeFamilyName(family);

  for (const sheet of document.styleSheets) {
    const found = findInSheet(sheet, normalized);
    if (found) {
      return found;
    }
  }

  return null;
}

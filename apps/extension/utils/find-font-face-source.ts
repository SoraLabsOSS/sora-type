export interface FontFaceSource {
  url: string;
}

const URL_PATTERN = /url\(\s*(['"]?)([^'")]+)\1\s*\)/i;
// Bounds worst-case walk time when discovering open shadow roots, mirroring
// the same safety cap in scan-page-fonts.ts.
const MAX_ELEMENTS_WALKED = 20_000;

function normalizeFamilyName(name: string): string {
  return name
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase();
}

function resolveUrl(
  rawUrl: string,
  sheet: CSSStyleSheet | null
): string | null {
  try {
    return new URL(rawUrl, sheet?.href ?? document.baseURI).href;
  } catch {
    return null;
  }
}

/** Recursively collects `@font-face` rules, descending into `@media`/
 * `@supports` blocks and `@import`ed stylesheets — none of which appear as
 * top-level entries in `sheet.cssRules`. */
function collectFontFaceRules(
  rules: CSSRuleList,
  out: CSSFontFaceRule[]
): void {
  for (const rule of rules) {
    if (rule instanceof CSSFontFaceRule) {
      out.push(rule);
    } else if (
      rule instanceof CSSMediaRule ||
      rule instanceof CSSSupportsRule
    ) {
      collectFontFaceRules(rule.cssRules, out);
    } else if (rule instanceof CSSImportRule && rule.styleSheet) {
      try {
        collectFontFaceRules(rule.styleSheet.cssRules, out);
      } catch {
        // Cross-origin @import without CORS headers on the imported sheet.
      }
    }
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

  const fontFaceRules: CSSFontFaceRule[] = [];
  collectFontFaceRules(rules, fontFaceRules);

  for (const rule of fontFaceRules) {
    const ruleFamily = rule.style.getPropertyValue("font-family");
    if (normalizeFamilyName(ruleFamily) !== family) {
      continue;
    }
    const src = rule.style.getPropertyValue("src");
    const match = src.match(URL_PATTERN);
    if (!match) {
      continue;
    }
    const url = resolveUrl(match[2], rule.parentStyleSheet ?? sheet);
    if (url) {
      return { url };
    }
  }

  return null;
}

/**
 * Collects every stylesheet reachable from the page: document-level
 * `<link>`/`<style>` sheets and adopted (constructable) stylesheets, plus
 * the same for every open shadow root (Web Component styles are commonly
 * applied via `shadowRoot.adoptedStyleSheets` rather than a `<style>` tag,
 * e.g. Lit's `static styles`) — neither of which appears in
 * `document.styleSheets`.
 */
function collectAllStyleSheets(): CSSStyleSheet[] {
  const sheets: CSSStyleSheet[] = [
    ...document.styleSheets,
    ...document.adoptedStyleSheets,
  ];
  let walked = 0;

  function visitShadowRoots(root: Node) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node && walked < MAX_ELEMENTS_WALKED) {
      walked++;
      const shadowRoot = (node as Element).shadowRoot;
      if (shadowRoot) {
        sheets.push(
          ...shadowRoot.styleSheets,
          ...shadowRoot.adoptedStyleSheets
        );
        visitShadowRoots(shadowRoot);
      }
      node = walker.nextNode();
    }
  }

  visitShadowRoots(document);
  return sheets;
}

/**
 * Finds the `@font-face` rule matching `family` (as returned by
 * `detectRenderedFont`) and resolves its `src: url(...)` to an absolute
 * URL. Returns `null` for system fonts (no `@font-face` at all) or when
 * every candidate stylesheet is unreadable/cross-origin-blocked.
 */
export function findFontFaceSource(family: string): FontFaceSource | null {
  const normalized = normalizeFamilyName(family);

  for (const sheet of collectAllStyleSheets()) {
    const found = findInSheet(sheet, normalized);
    if (found) {
      return found;
    }
  }

  return null;
}

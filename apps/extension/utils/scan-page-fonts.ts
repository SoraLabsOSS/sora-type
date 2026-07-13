import { detectRenderedFont } from "./font-detect";

export interface PageFontSummary {
  elementCount: number;
  family: string;
}

// Bounds worst-case walk time on huge pages (counts every element visited,
// not just text-bearing ones, so a page with a few real paragraphs buried
// under thousands of empty wrapper divs doesn't get cut off early).
const MAX_ELEMENTS_WALKED = 20_000;

function hasDirectText(element: Element): boolean {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }
  return false;
}

function isVisible(element: Element, style: CSSStyleDeclaration): boolean {
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  // `offsetParent` is null for `position: fixed` elements even when they're
  // genuinely on screen, so check actual layout boxes instead.
  return element.getClientRects().length > 0;
}

function styleKey(computed: CSSStyleDeclaration): string {
  return `${computed.fontFamily}|${computed.fontWeight}|${computed.fontStyle}`;
}

function toSortedSummaries(counts: Map<string, number>): PageFontSummary[] {
  return [...counts.entries()]
    .map(([family, elementCount]) => ({ family, elementCount }))
    .sort((a, b) => b.elementCount - a.elementCount);
}

/**
 * Combines each frame's own `scanPageFonts()` result into one page-wide
 * summary, summing element counts for families that appear in more than one
 * frame (e.g. a shared brand font used by both the parent page and an
 * embedded iframe).
 */
export function mergeFrameFontSummaries(
  perFrame: PageFontSummary[][]
): PageFontSummary[] {
  const counts = new Map<string, number>();
  for (const fonts of perFrame) {
    for (const { family, elementCount } of fonts) {
      counts.set(family, (counts.get(family) ?? 0) + elementCount);
    }
  }
  return toSortedSummaries(counts);
}

/**
 * Lists every font actually rendering on the page, grouped by family with
 * an element count, sorted most-used first.
 *
 * `getComputedStyle` is cheap and runs once per candidate element, but
 * `detectRenderedFont`'s canvas-diffing is not free — so elements sharing
 * the same font-family/weight/style computed style are deduped into a
 * single detection call via `styleCache`, keeping the expensive part
 * bounded by the page's number of *distinct* text styles (typically a
 * handful) rather than its element count.
 */
export function scanPageFonts(): PageFontSummary[] {
  const counts = new Map<string, number>();
  const styleCache = new Map<string, string>();
  let walked = 0;

  function visit(element: Element) {
    const style = getComputedStyle(element);
    if (isVisible(element, style) && hasDirectText(element)) {
      const key = styleKey(style);
      let family = styleCache.get(key);
      if (family === undefined) {
        family = detectRenderedFont(element).family;
        styleCache.set(key, family);
      }
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
    // Web Components render their content into a separate shadow tree that
    // a TreeWalker rooted at document.body never descends into — walk it
    // explicitly so text inside open shadow roots isn't invisible to scans.
    if (element.shadowRoot) {
      walkRoot(element.shadowRoot);
    }
  }

  function walkRoot(root: Element | ShadowRoot) {
    if (root instanceof Element) {
      visit(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node && walked < MAX_ELEMENTS_WALKED) {
      visit(node as Element);
      walked++;
      node = walker.nextNode();
    }
  }

  walkRoot(document.body);

  return toSortedSummaries(counts);
}

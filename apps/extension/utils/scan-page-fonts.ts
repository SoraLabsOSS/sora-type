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

function isVisible(element: Element): boolean {
  return (element as HTMLElement).offsetParent !== null;
}

function styleKey(computed: CSSStyleDeclaration): string {
  return `${computed.fontFamily}|${computed.fontWeight}|${computed.fontStyle}`;
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
    if (isVisible(element) && hasDirectText(element)) {
      const key = styleKey(getComputedStyle(element));
      let family = styleCache.get(key);
      if (family === undefined) {
        family = detectRenderedFont(element).family;
        styleCache.set(key, family);
      }
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
  }

  visit(document.body);
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT
  );
  let node = walker.nextNode();
  while (node && walked < MAX_ELEMENTS_WALKED) {
    visit(node as Element);
    walked++;
    node = walker.nextNode();
  }

  return [...counts.entries()]
    .map(([family, elementCount]) => ({ family, elementCount }))
    .sort((a, b) => b.elementCount - a.elementCount);
}

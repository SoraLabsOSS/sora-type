/** The furthest top-left position a `width`×`height` box can have while
 * staying fully inside the current viewport, `margin` px from each edge. */
export function maxViewportPosition(
  width: number,
  height: number,
  margin = 8
): { x: number; y: number } {
  return {
    x: Math.max(margin, window.innerWidth - width - margin),
    y: Math.max(margin, window.innerHeight - height - margin),
  };
}

/** Clamps a top-left position so a `width`×`height` box stays fully inside
 * the current viewport, with `margin` px of breathing room from each edge. */
export function clampToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 8
): { x: number; y: number } {
  const max = maxViewportPosition(width, height, margin);

  return {
    x: Math.min(Math.max(x, margin), max.x),
    y: Math.min(Math.max(y, margin), max.y),
  };
}

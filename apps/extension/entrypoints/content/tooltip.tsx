import type { FontDetectionResult } from "@/utils/font-detect";
import { clampToViewport } from "@/utils/viewport";

const OFFSET_PX = 12;
// Rough upper-bound estimate — the tooltip is a single line of text, so
// exact measurement isn't worth the extra render pass here.
const TOOLTIP_WIDTH_ESTIMATE = 200;
const TOOLTIP_HEIGHT_ESTIMATE = 28;

export function Tooltip({
  result,
  x,
  y,
}: {
  result: FontDetectionResult;
  x: number;
  y: number;
}) {
  const position = clampToViewport(
    x + OFFSET_PX,
    y + OFFSET_PX,
    TOOLTIP_WIDTH_ESTIMATE,
    TOOLTIP_HEIGHT_ESTIMATE
  );

  return (
    <div
      className="pointer-events-none fixed z-[2147483647] rounded-md bg-black/90 px-2 py-1 font-sans text-white text-xs shadow-lg"
      style={{ top: position.y, left: position.x }}
    >
      {result.family}
    </div>
  );
}

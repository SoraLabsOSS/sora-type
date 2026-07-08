import { motion, useDragControls } from "motion/react";
import type { RefObject } from "react";
import type { FontDetectionResult } from "@/utils/font-detect";
import { clampToViewport } from "@/utils/viewport";

const OFFSET_PX = 12;
// Content is a bounded set of fields (not user-length-variable), so a
// static estimate is fine — no need to measure after mount.
const PANEL_WIDTH = 256; // matches w-64
const PANEL_HEIGHT_ESTIMATE = 190;

export function Panel({
  constraintsRef,
  onClose,
  result,
  x,
  y,
}: {
  constraintsRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  result: FontDetectionResult;
  x: number;
  y: number;
}) {
  const dragControls = useDragControls();
  const position = clampToViewport(
    x + OFFSET_PX,
    y + OFFSET_PX,
    PANEL_WIDTH,
    PANEL_HEIGHT_ESTIMATE
  );

  return (
    <motion.div
      className="pointer-events-auto fixed z-[2147483647] flex w-64 flex-col gap-2 rounded-lg bg-black/90 p-3 font-sans text-white text-xs shadow-lg"
      drag
      dragConstraints={constraintsRef}
      dragControls={dragControls}
      dragElastic={0}
      dragListener={false}
      dragMomentum={false}
      style={{ top: position.y, left: position.x }}
    >
      <div
        className="flex cursor-move items-start justify-between gap-2"
        onPointerDown={(event) => dragControls.start(event)}
      >
        <p className="font-semibold text-sm">{result.family}</p>
        <button
          aria-label="Close"
          className="cursor-pointer text-white/60 hover:text-white"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-white/70">
        <dt>Variant</dt>
        <dd className="text-right text-white">{result.variant}</dd>
        <dt>Size</dt>
        <dd className="text-right text-white">{result.size}</dd>
        <dt>Line height</dt>
        <dd className="text-right text-white">{result.lineHeight}</dd>
        <dt>Color</dt>
        <dd className="flex items-center justify-end gap-1 text-white">
          <span
            className="inline-block h-3 w-3 rounded-full border border-white/30"
            style={{ backgroundColor: result.color }}
          />
          {result.color}
        </dd>
      </dl>
      <p className="truncate text-white/50">{result.stack.join(", ")}</p>
    </motion.div>
  );
}

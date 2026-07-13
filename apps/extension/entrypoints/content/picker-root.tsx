import { useEffect, useRef, useState } from "react";
import {
  detectRenderedFont,
  type FontDetectionResult,
} from "@/utils/font-detect";
import { sendMessage } from "@/utils/messaging";
import { pickerEnabled } from "@/utils/storage";
import { Panel } from "./panel";
import { Tooltip } from "./tooltip";

interface Pin {
  id: string;
  result: FontDetectionResult;
  x: number;
  y: number;
}

interface Hover {
  result: FontDetectionResult;
  x: number;
  y: number;
}

async function saveToRecent(family: string) {
  await sendMessage("saveRecentFont", { family });
}

function generatePinId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID() requires a secure context; this content script also
  // runs on http:// pages/iframes (matches: "*://*/*"), where it's
  // undefined. crypto.getRandomValues() works everywhere, so fall back to
  // it there — this id is only ever used as a React list key, no format
  // requirement.
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) =>
    n.toString(36)
  ).join("-");
}

export function PickerRoot({ shadowHost }: { shadowHost: HTMLElement }) {
  const [hover, setHover] = useState<Hover | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const cacheRef = useRef(new WeakMap<Element, FontDetectionResult>());
  // Framer Motion's `dragConstraints` needs a real element to measure
  // against for accurate viewport bounds (an object of `{top,left,...}`
  // pixel values is interpreted as an offset from the drag start position,
  // not absolute coordinates — a full-viewport ref is the correct way to
  // constrain dragging to "stay on screen").
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function detect(element: Element): FontDetectionResult {
      const cached = cacheRef.current.get(element);
      if (cached) {
        return cached;
      }
      const result = detectRenderedFont(element);
      cacheRef.current.set(element, result);
      return result;
    }

    function handleMouseMove(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element) || target === shadowHost) {
        setHover(null);
        return;
      }
      setHover({
        result: detect(target),
        x: event.clientX,
        y: event.clientY,
      });
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (target === shadowHost) {
        // Clicks on our own tooltip/panel — let them behave normally
        // (e.g. the panel's own close button).
        return;
      }
      if (!(target instanceof Element)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const result = detect(target);
      setPins((prev) => [
        ...prev,
        { id: generatePinId(), result, x: event.clientX, y: event.clientY },
      ]);
      saveToRecent(result.family).catch(() => {
        // Best-effort — background may not be awake yet, or the extension
        // context was invalidated (reload/update). Not worth surfacing.
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pickerEnabled.setValue(false);
      }
    }

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [shadowHost]);

  return (
    <div className="pointer-events-none fixed inset-0" ref={viewportRef}>
      {hover && <Tooltip result={hover.result} x={hover.x} y={hover.y} />}
      {pins.map((pin) => (
        <Panel
          constraintsRef={viewportRef}
          key={pin.id}
          onClose={() => setPins((prev) => prev.filter((p) => p.id !== pin.id))}
          result={pin.result}
          x={pin.x}
          y={pin.y}
        />
      ))}
    </div>
  );
}

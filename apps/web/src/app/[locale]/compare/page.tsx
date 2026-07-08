"use client";

import dynamic from "next/dynamic";

// fontkit/harfbuzzjs initialize a WASM module at import time, which breaks
// during SSR of a client component. Deferring the import until the browser
// mounts it avoids that entirely — see src/lib/font-shaping.ts.
const CompareView = dynamic(() => import("@/components/compare-view"), {
  ssr: false,
});

export default function ComparePage() {
  return <CompareView />;
}

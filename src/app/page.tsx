"use client";

import dynamic from "next/dynamic";

// fontkit/harfbuzzjs initialize a WASM module at import time, which breaks
// during SSR of a client component. Deferring the import until the browser
// mounts it avoids that entirely — see src/lib/font-shaping.ts.
const FontInspector = dynamic(() => import("@/components/font-inspector"), {
  ssr: false,
});

export default function HomePage() {
  return <FontInspector />;
}

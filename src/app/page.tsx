"use client";

import { Section } from "@astryxdesign/core/Section";
import dynamic from "next/dynamic";
import { DashboardLoadingShell } from "@/components/font-inspector-shell";

const INSPECTOR_SECTION_CLASS =
  "flex min-h-0 flex-1 flex-col max-lg:flex-none max-lg:overflow-visible lg:overflow-hidden";

function FontInspectorLoadingShell() {
  return (
    <Section className={INSPECTOR_SECTION_CLASS} padding={4}>
      <DashboardLoadingShell />
    </Section>
  );
}

// fontkit/harfbuzzjs initialize a WASM module at import time, which breaks
// during SSR of a client component. Deferring the import until the browser
// mounts it avoids that entirely — see src/lib/font-shaping.ts.
const FontInspector = dynamic(() => import("@/components/font-inspector"), {
  ssr: false,
  loading: () => <FontInspectorLoadingShell />,
});

export default function HomePage() {
  return <FontInspector />;
}

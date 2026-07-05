"use client";

import { FileInput } from "@astryxdesign/core/FileInput";

export const INSPECTOR_FONT_ACCEPT = ".ttf,.otf,.woff,.woff2";
export const INSPECTOR_FONT_DESCRIPTION = "OTF, TTF, WOFF, or WOFF2";
export const INSPECTOR_FONT_LABEL = "Font file";

const noopFileChange = () => {
  return;
};

interface InspectorFileInputShellProps {
  isLoading?: boolean;
  pointerEventsNone?: boolean;
}

/** Non-interactive FileInput shell — matches the homepage dropzone layout exactly. */
export function InspectorFileInputShell({
  isLoading = false,
  pointerEventsNone = true,
}: InspectorFileInputShellProps) {
  return (
    <div
      aria-busy={isLoading || undefined}
      className={pointerEventsNone ? "pointer-events-none" : undefined}
    >
      <FileInput
        accept={INSPECTOR_FONT_ACCEPT}
        description={INSPECTOR_FONT_DESCRIPTION}
        isLoading={isLoading}
        label={INSPECTOR_FONT_LABEL}
        mode="dropzone"
        onChange={noopFileChange}
        value={null}
      />
    </div>
  );
}

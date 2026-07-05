"use client";

import type { FileInputProps } from "@astryxdesign/core/FileInput";
import { FileInput } from "@astryxdesign/core/FileInput";

export const INSPECTOR_FONT_ACCEPT = ".ttf,.otf,.woff,.woff2";
export const INSPECTOR_FONT_LABEL = "Upload font";
export const INSPECTOR_FONT_PLACEHOLDER = "Drop font here or click to upload";
export const INSPECTOR_FONT_DESCRIPTION = "Supports TTF · OTF · WOFF · WOFF2";

type InspectorFontUploadProps = Omit<
  FileInputProps,
  "description" | "label" | "mode" | "placeholder"
>;

export function InspectorFontUpload(props: InspectorFontUploadProps) {
  return (
    <div className="inspector-upload [&_[role=button]]:min-h-[7.5rem] [&_[role=button]]:border-border-strong [&_[role=button]]:text-primary [&_[role=button]_span]:text-primary [&_[role=button]_svg]:size-8 [&_[role=button]_svg]:text-primary">
      <FileInput
        description={INSPECTOR_FONT_DESCRIPTION}
        isLabelHidden
        label={INSPECTOR_FONT_LABEL}
        mode="dropzone"
        placeholder={INSPECTOR_FONT_PLACEHOLDER}
        {...props}
      />
    </div>
  );
}

const noopFileChange = () => {
  return;
};

interface InspectorFileInputShellProps {
  isLoading?: boolean;
  pointerEventsNone?: boolean;
}

/** Non-interactive upload shell — matches the homepage dropzone layout exactly. */
export function InspectorFileInputShell({
  isLoading = false,
  pointerEventsNone = true,
}: InspectorFileInputShellProps) {
  return (
    <div
      aria-busy={isLoading || undefined}
      className={pointerEventsNone ? "pointer-events-none" : undefined}
    >
      <InspectorFontUpload
        accept={INSPECTOR_FONT_ACCEPT}
        isLoading={isLoading}
        onChange={noopFileChange}
        value={null}
      />
    </div>
  );
}

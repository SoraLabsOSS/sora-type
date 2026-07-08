"use client";

import type { FileInputProps } from "@astryxdesign/core/FileInput";
import { FileInput } from "@astryxdesign/core/FileInput";
import { useTranslations } from "next-intl";

export const INSPECTOR_FONT_ACCEPT = ".ttf,.otf,.woff,.woff2";

type InspectorFontUploadProps = Omit<
  FileInputProps,
  "description" | "label" | "mode" | "placeholder"
>;

export function InspectorFontUpload(props: InspectorFontUploadProps) {
  const t = useTranslations("inspector.upload");

  return (
    <div className="inspector-upload [&_[role=button]]:min-h-[7.5rem] [&_[role=button]]:border-border-strong [&_[role=button]]:text-primary [&_[role=button]_span]:text-primary [&_[role=button]_svg]:size-8 [&_[role=button]_svg]:text-primary">
      <FileInput
        description={t("description")}
        isLabelHidden
        label={t("label")}
        mode="dropzone"
        placeholder={t("placeholder")}
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

import type { FontDetailField } from "@sora-type/font-engine/font-metadata";
import { i18n } from "#i18n";

const SORA_TYPE_URL = "https://type.soralabs.io.vn";

export function FontSummaryFields({
  fields,
  fontUrl,
}: {
  fields: FontDetailField[];
  fontUrl: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-border border-t pt-2">
      {fields.map((field) => (
        <div className="flex justify-between gap-2 text-xs" key={field.label}>
          <span className="text-muted-foreground">{field.label}</span>
          <span className="truncate text-right">{field.value}</span>
        </div>
      ))}
      <a
        className="mt-1 text-primary text-xs hover:underline"
        href={`${SORA_TYPE_URL}/?inspectUrl=${encodeURIComponent(fontUrl)}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {i18n.t("recentFontRow.openInSoraType")}
      </a>
    </div>
  );
}

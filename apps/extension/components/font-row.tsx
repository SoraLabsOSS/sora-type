import { useState } from "react";
import { i18n } from "#i18n";
import { FontSummaryFields } from "@/components/font-summary-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import type { LoadFontSummaryResult } from "@/utils/load-font-summary";
import { openSidePanelToRecent } from "@/utils/open-side-panel";

export type FontRowState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "tab-not-found" }
  | LoadFontSummaryResult;

function RowStatusMessage({ state }: { state: FontRowState }) {
  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Spinner className="size-3" />
        {i18n.t("recentFontRow.loading")}
      </div>
    );
  }

  if (state.status === "tab-not-found") {
    return (
      <Alert className="py-2" variant="destructive">
        <AlertDescription className="text-xs">
          {i18n.t("recentFontRow.tabNotFound")}
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "not-found") {
    return (
      <Alert className="py-2">
        <AlertDescription className="text-xs">
          {i18n.t("recentFontRow.notFound")}
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "error") {
    return (
      <Alert className="py-2" variant="destructive">
        <AlertDescription className="text-xs">{state.message}</AlertDescription>
      </Alert>
    );
  }

  if (state.status === "loaded") {
    return <FontSummaryFields fields={state.fields} fontUrl={state.fontUrl} />;
  }

  return null;
}

export function FontRow({
  badge,
  description,
  family,
  loadAction = "inline",
  onLoadSummary,
}: {
  badge?: number;
  description?: string;
  family: string;
  loadAction?: "inline" | "side-panel";
  onLoadSummary: () => Promise<FontRowState>;
}) {
  const [state, setState] = useState<FontRowState>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    const result = await onLoadSummary();
    setState(result);
  }

  async function openInSidePanel() {
    await openSidePanelToRecent({ closePopup: true });
  }

  const loadLabel =
    loadAction === "side-panel"
      ? i18n.t("recentFontRow.loadInSidePanel")
      : i18n.t("recentFontRow.loadRealFontName");

  return (
    <Item render={<li />} size="sm" variant="outline">
      <ItemContent>
        <ItemHeader>
          <ItemTitle className="truncate">{family}</ItemTitle>
          {badge === undefined ? null : (
            <ItemActions>
              <Badge variant="secondary">{badge}</Badge>
            </ItemActions>
          )}
        </ItemHeader>
        {description ? (
          <ItemDescription className="truncate">{description}</ItemDescription>
        ) : null}

        {loadAction === "side-panel" ? (
          <Button
            className="h-auto self-start px-0"
            onClick={openInSidePanel}
            size="xs"
            type="button"
            variant="link"
          >
            {loadLabel}
          </Button>
        ) : null}
        {loadAction === "inline" && state.status === "idle" ? (
          <Button
            className="h-auto self-start px-0"
            onClick={load}
            size="xs"
            type="button"
            variant="link"
          >
            {loadLabel}
          </Button>
        ) : null}
        {loadAction === "inline" && state.status !== "idle" ? (
          <RowStatusMessage state={state} />
        ) : null}
      </ItemContent>
    </Item>
  );
}

"use client";

import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/Layout";
import type {
  SearchableItem,
  SearchSource,
} from "@astryxdesign/core/Typeahead";
import { Typeahead } from "@astryxdesign/core/Typeahead";
import {
  isLocalFontAccessSupported,
  type LocalFontEntry,
  type LocalFontPermissionState,
  loadLocalFonts,
  readLocalFontBuffer,
  subscribeLocalFontPermission,
} from "@sora-type/font-engine/local-fonts";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocalFontAccessHelpDialog } from "@/components/local-font-access-help-dialog";

type LocalFontItem = SearchableItem<{ fontData: FontData }>;

function toItems(entries: LocalFontEntry[]): LocalFontItem[] {
  return entries.map((entry) => ({
    auxiliaryData: { fontData: entry.fontData },
    id: entry.id,
    label: entry.label,
  }));
}

interface InspectorLocalFontPickerProps {
  isDisabled?: boolean;
  onClear?: () => void;
  onSelect: (fileName: string, buffer: ArrayBuffer) => void;
}

/**
 * Lets the user pick a font already installed on their system instead of
 * uploading a file, via the (Chromium-only) Local Font Access API. Renders
 * nothing when the API isn't supported.
 */
export function InspectorLocalFontPicker({
  isDisabled,
  onClear,
  onSelect,
}: InspectorLocalFontPickerProps) {
  const t = useTranslations("inspector.localFontPicker");
  const supported = useMemo(() => isLocalFontAccessSupported(), []);
  const [permission, setPermission] =
    useState<LocalFontPermissionState>("prompt");
  const [helpOpen, setHelpOpen] = useState(false);
  const [value, setValue] = useState<LocalFontItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<LocalFontEntry[] | null>(null);

  useEffect(() => {
    let cleanup = () => {
      return;
    };
    let cancelled = false;

    subscribeLocalFontPermission((state) => {
      if (cancelled) {
        return;
      }
      setPermission(state);
      if (state !== "granted") {
        cacheRef.current = null;
        setValue(null);
      }
    }).then((unsubscribe) => {
      if (cancelled) {
        unsubscribe();
        return;
      }
      cleanup = unsubscribe;
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const ensureFonts = useCallback(async (): Promise<LocalFontItem[]> => {
    if (permission === "denied") {
      return [];
    }
    if (cacheRef.current) {
      return toItems(cacheRef.current);
    }
    try {
      const entries = await loadLocalFonts();
      cacheRef.current = entries;
      setPermission("granted");
      return toItems(entries);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setPermission("denied");
      }
      return [];
    }
  }, [permission]);

  const searchSource = useMemo<SearchSource<LocalFontItem>>(
    () => ({
      bootstrap: ensureFonts,
      search: async (query) => {
        const items = cacheRef.current
          ? toItems(cacheRef.current)
          : await ensureFonts();
        const q = query.toLowerCase().trim();
        return q
          ? items.filter((item) => item.label.toLowerCase().includes(q))
          : items;
      },
    }),
    [ensureFonts]
  );

  const handleChange = useCallback(
    async (item: LocalFontItem | null) => {
      setError(null);
      if (!item?.auxiliaryData) {
        setValue(null);
        onClear?.();
        return;
      }
      try {
        const { fontData } = item.auxiliaryData;
        const buffer = await readLocalFontBuffer(fontData);
        onSelect(fontData.postscriptName || item.label, buffer);
        setValue(item);
      } catch (err) {
        setValue(null);
        setError(err instanceof Error ? err.message : t("errorFallback"));
      }
    },
    [onSelect, onClear, t]
  );

  if (!supported) {
    return null;
  }

  const isPermissionDenied = permission === "denied";

  return (
    <VStack gap={2}>
      <Typeahead
        description={
          isPermissionDenied
            ? t("descriptionBlocked")
            : t("descriptionAvailable")
        }
        disabledMessage={isPermissionDenied ? t("disabledMessage") : undefined}
        hasEntriesOnFocus
        isDisabled={isDisabled || isPermissionDenied}
        label={t("label")}
        onChange={handleChange}
        placeholder={t("placeholder")}
        searchSource={searchSource}
        status={error ? { type: "error", message: error } : undefined}
        value={value}
      />
      {isPermissionDenied ? (
        <Button
          label={t("howToEnable")}
          onClick={() => setHelpOpen(true)}
          size="sm"
          variant="ghost"
        />
      ) : null}
      <LocalFontAccessHelpDialog isOpen={helpOpen} onOpenChange={setHelpOpen} />
    </VStack>
  );
}

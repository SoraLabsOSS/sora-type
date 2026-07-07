"use client";

import type {
  SearchableItem,
  SearchSource,
} from "@astryxdesign/core/Typeahead";
import { Typeahead } from "@astryxdesign/core/Typeahead";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  isLocalFontAccessSupported,
  type LocalFontEntry,
  loadLocalFonts,
  readLocalFontBuffer,
} from "@/lib/local-fonts";

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
  const supported = useMemo(() => isLocalFontAccessSupported(), []);
  const [permission, setPermission] = useState<"denied" | "granted" | "prompt">(
    "prompt"
  );
  const [value, setValue] = useState<LocalFontItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<LocalFontEntry[] | null>(null);

  const ensureFonts = useCallback(async (): Promise<LocalFontItem[]> => {
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
  }, []);

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
        setError(
          err instanceof Error ? err.message : "Could not read local font"
        );
      }
    },
    [onSelect, onClear]
  );

  if (!supported) {
    return null;
  }

  return (
    <Typeahead
      description={
        permission === "denied"
          ? "Local font access was denied. Allow it in your browser's site settings to use this."
          : "Pick a font already installed on your system (Chrome/Edge only)."
      }
      hasEntriesOnFocus
      isDisabled={isDisabled || permission === "denied"}
      label="Or pick a local font"
      onChange={handleChange}
      placeholder="Search installed fonts…"
      searchSource={searchSource}
      status={error ? { type: "error", message: error } : undefined}
      value={value}
    />
  );
}

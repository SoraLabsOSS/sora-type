"use client";

import { Switch } from "@astryxdesign/core/Switch";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useCallback, useEffect, useState } from "react";
import { useThemeMode } from "@/components/theme/theme-provider";
import { setThemeWithTransition } from "@/lib/theme/set-theme-with-transition";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { resolvedTheme, setMode } = useThemeMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(
    (checked: boolean) => {
      setThemeWithTransition(setMode, checked ? "dark" : "light");
    },
    [setMode]
  );

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="inline-flex h-6 w-10 shrink-0 items-center justify-center"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const hint = isDark ? "Light" : "Dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip content={hint} placement="above">
      <Switch
        className={className}
        isLabelHidden
        label={label}
        onChange={handleThemeChange}
        value={isDark}
      />
    </Tooltip>
  );
}

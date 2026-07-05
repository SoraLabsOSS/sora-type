"use client";

import { Switch } from "@astryxdesign/core/Switch";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useCallback, useEffect, useState } from "react";
import { useThemeMode } from "@/components/theme/theme-provider";
import { setThemeWithTransition } from "@/lib/theme/set-theme-with-transition";
import { cn } from "@/lib/utils";

const SWITCH_TRACK_WIDTH = 40;
const MOBILE_NAV_MEDIA = "(max-width: 1023px)";

function useMobileNavLayout() {
  const [isMobileNav, setIsMobileNav] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_NAV_MEDIA);
    const sync = () => setIsMobileNav(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobileNav;
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { resolvedTheme, setMode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isMobileNav = useMobileNavLayout();

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
        className="inline-flex h-6 items-center justify-center max-lg:w-10 max-lg:shrink-0"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const hint = isDark ? "Light" : "Dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip content={hint} placement="above">
      <Switch
        className={cn(isMobileNav && "shrink-0", className)}
        isLabelHidden
        label={label}
        onChange={handleThemeChange}
        value={isDark}
        width={isMobileNav ? SWITCH_TRACK_WIDTH : undefined}
      />
    </Tooltip>
  );
}

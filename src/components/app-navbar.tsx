"use client";

import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

function BrandWordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="font-heading font-semibold text-lg tracking-tight">
        Sora Type
      </span>
    </span>
  );
}

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <TopNav
      centerContent={
        <>
          <TopNavItem
            href="/"
            isSelected={pathname === "/"}
            label="Inspector"
          />
          <TopNavItem
            href="/compare"
            isSelected={pathname === "/compare"}
            label="Compare"
          />
        </>
      }
      endContent={<ThemeSwitcher />}
      heading={
        <TopNavHeading
          headingHref="/"
          logo={<BrandWordmark />}
          logoLabel="Sora Type"
        />
      }
      label="Primary navigation"
    />
  );
}

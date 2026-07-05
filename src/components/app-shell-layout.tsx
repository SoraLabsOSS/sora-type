"use client";

import { AppShell } from "@astryxdesign/core/AppShell";
import { Section } from "@astryxdesign/core/Section";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

function AppTopNav() {
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

/** Propagate flex height through Astryx Section's inner wrapper. */
const SECTION_FILL_CLASS =
  "[&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col";

const MAIN_SCROLL_CLASS = [
  "scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto lg:h-full lg:overflow-hidden",
  SECTION_FILL_CLASS,
].join(" ");

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      className="min-h-0 flex-1"
      contentPadding={0}
      height="fill"
      mobileNav={{ breakpoint: "lg" }}
      topNav={<AppTopNav />}
    >
      <Section className={MAIN_SCROLL_CLASS} padding={0}>
        {children}
      </Section>
    </AppShell>
  );
}

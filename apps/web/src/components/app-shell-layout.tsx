"use client";

import { AppShell } from "@astryxdesign/core/AppShell";
import { Section } from "@astryxdesign/core/Section";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AppInfoSheet } from "@/components/app-info-sheet";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { usePathname } from "@/i18n/navigation";

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
  const t = useTranslations("common.nav");

  return (
    <TopNav
      centerContent={
        <>
          <TopNavItem
            href="/"
            isSelected={pathname === "/"}
            label={t("inspector")}
          />
          <TopNavItem
            href="/compare"
            isSelected={pathname === "/compare"}
            label={t("compare")}
          />
        </>
      }
      endContent={
        <>
          <AppInfoSheet />
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>
          <ThemeSwitcher />
        </>
      }
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

"use client";

import { LinkProvider } from "@astryxdesign/core/Link";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function AppLinkProvider({ children }: { children: ReactNode }) {
  return <LinkProvider component={Link}>{children}</LinkProvider>;
}

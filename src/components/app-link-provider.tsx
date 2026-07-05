"use client";

import { LinkProvider } from "@astryxdesign/core/Link";
import Link from "next/link";
import type { ReactNode } from "react";

export function AppLinkProvider({ children }: { children: ReactNode }) {
  return <LinkProvider component={Link}>{children}</LinkProvider>;
}

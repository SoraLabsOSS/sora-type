"use client";

import type * as React from "react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
}

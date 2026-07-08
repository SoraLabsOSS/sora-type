import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "en",
  // English stays unprefixed ("/", "/compare") to keep existing URLs/SEO
  // intact; Vietnamese pages are served under "/vi".
  localePrefix: "as-needed",
});

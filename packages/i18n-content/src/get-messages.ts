import about_en from "./locales/en/about.json" with { type: "json" };
import common_en from "./locales/en/common.json" with { type: "json" };
import compare_en from "./locales/en/compare.json" with { type: "json" };
import extension_en from "./locales/en/extension.json" with { type: "json" };
import inspector_en from "./locales/en/inspector.json" with { type: "json" };
import privacy_en from "./locales/en/privacy.json" with { type: "json" };
import about_vi from "./locales/vi/about.json" with { type: "json" };
import common_vi from "./locales/vi/common.json" with { type: "json" };
import compare_vi from "./locales/vi/compare.json" with { type: "json" };
import extension_vi from "./locales/vi/extension.json" with { type: "json" };
import inspector_vi from "./locales/vi/inspector.json" with { type: "json" };
import privacy_vi from "./locales/vi/privacy.json" with { type: "json" };

export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const namespaces = {
  common: { en: common_en, vi: common_vi },
  extension: { en: extension_en, vi: extension_vi },
  about: { en: about_en, vi: about_vi },
  privacy: { en: privacy_en, vi: privacy_vi },
  compare: { en: compare_en, vi: compare_vi },
  inspector: { en: inspector_en, vi: inspector_vi },
} as const;

export type Namespace = keyof typeof namespaces;

/**
 * Merges the requested namespaces for a locale into a single messages object,
 * keyed by namespace (e.g. `{ common: {...}, extension: {...} }`), matching
 * the shape next-intl's `NextIntlClientProvider` expects.
 */
export function getMessages(locale: Locale, include?: Namespace[]) {
  const keys = include ?? (Object.keys(namespaces) as Namespace[]);
  return Object.fromEntries(
    keys.map((namespace) => [namespace, namespaces[namespace][locale]])
  );
}

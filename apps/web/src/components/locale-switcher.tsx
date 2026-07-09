"use client";

import { Selector } from "@astryxdesign/core/Selector";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LocaleCode = (typeof routing.locales)[number];

function isLocaleCode(value: string): value is LocaleCode {
  return routing.locales.includes(value as LocaleCode);
}

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.language");
  const router = useRouter();
  const pathname = usePathname();

  const options = routing.locales.map((code) => ({
    value: code,
    label: t(code),
  }));

  return (
    <Selector
      isLabelHidden
      label={t("label")}
      onChange={(value) => {
        if (isLocaleCode(value)) {
          router.replace(pathname, { locale: value });
        }
      }}
      options={options}
      size="sm"
      value={locale}
    />
  );
}

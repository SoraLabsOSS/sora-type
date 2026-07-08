"use client";

import {
  ToggleButton,
  ToggleButtonGroup,
} from "@astryxdesign/core/ToggleButton";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.language");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ToggleButtonGroup
      label={t("label")}
      onChange={(value) => {
        if (typeof value === "string") {
          router.replace(pathname, { locale: value });
        }
      }}
      value={locale}
    >
      <ToggleButton label={t("en")} value="en" />
      <ToggleButton label={t("vi")} value="vi" />
    </ToggleButtonGroup>
  );
}

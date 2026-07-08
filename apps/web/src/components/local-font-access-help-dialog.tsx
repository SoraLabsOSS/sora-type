"use client";

import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface LocalFontAccessHelpDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function getBrowserLabel(): string {
  if (typeof navigator === "undefined") {
    return "Chrome or Edge";
  }
  return navigator.userAgent.includes("Edg/") ? "Edge" : "Chrome";
}

function getSettingsPath(browser: string): string {
  return browser === "Edge"
    ? "edge://settings/content/localFonts"
    : "chrome://settings/content/localFonts";
}

export function LocalFontAccessHelpDialog({
  isOpen,
  onOpenChange,
}: LocalFontAccessHelpDialogProps) {
  const t = useTranslations("inspector.localFontPicker.helpDialog");
  const browser = useMemo(() => getBrowserLabel(), []);
  const settingsPath = useMemo(() => getSettingsPath(browser), [browser]);
  const boldTag = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

  return (
    <Dialog
      className="local-font-help-dialog"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="info"
      width={480}
    >
      <Layout
        content={
          <LayoutContent>
            <VStack gap={3}>
              <Text type="body">{t.rich("blockedExplanation", boldTag)}</Text>

              <VStack gap={2}>
                <Heading className="font-sans" level={4}>
                  {t("quickFixHeading")}
                </Heading>
                <ol className="list-decimal space-y-2 pl-5 text-primary text-sm leading-relaxed">
                  <li>{t.rich("step1", boldTag)}</li>
                  <li>{t.rich("step2", boldTag)}</li>
                  <li>{t.rich("step3", boldTag)}</li>
                  <li>{t("step4")}</li>
                </ol>
              </VStack>

              <VStack gap={2}>
                <Heading className="font-sans" level={4}>
                  {t("fromBrowserSettingsHeading", { browser })}
                </Heading>
                <Text type="body">
                  {t.rich("fromBrowserSettingsBody", {
                    ...boldTag,
                    code: (chunks) => <code className="text-sm">{chunks}</code>,
                    settingsPath,
                  })}
                </Text>
              </VStack>

              <Text color="secondary" type="supporting">
                {t("chromiumOnlyNote", { browser })}
              </Text>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <Button
              label={t("gotIt")}
              onClick={() => onOpenChange(false)}
              variant="primary"
            />
          </LayoutFooter>
        }
        header={
          <DialogHeader
            onOpenChange={onOpenChange}
            subtitle={t("subtitle")}
            title={t("title")}
          />
        }
      />
    </Dialog>
  );
}

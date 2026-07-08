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
  const browser = useMemo(() => getBrowserLabel(), []);
  const settingsPath = useMemo(() => getSettingsPath(browser), [browser]);

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
              <Text type="body">
                If you chose <strong>Block</strong> when the browser asked for
                local font access, it will not show that prompt again. Turn the
                permission back on in your browser&apos;s site settings, then
                reload this page.
              </Text>

              <VStack gap={2}>
                <Heading className="font-sans" level={4}>
                  Quick fix (address bar)
                </Heading>
                <ol className="list-decimal space-y-2 pl-5 text-primary text-sm leading-relaxed">
                  <li>
                    Click the <strong>lock</strong> or <strong>tune</strong>{" "}
                    icon to the left of the address bar on this site.
                  </li>
                  <li>
                    Open <strong>Site settings</strong> (or{" "}
                    <strong>Permissions</strong>).
                  </li>
                  <li>
                    Find <strong>Local fonts</strong> and set it to{" "}
                    <strong>Allow</strong>.
                  </li>
                  <li>Reload this page, then search installed fonts again.</li>
                </ol>
              </VStack>

              <VStack gap={2}>
                <Heading className="font-sans" level={4}>
                  From {browser} settings
                </Heading>
                <Text type="body">
                  Open <code className="text-sm">{settingsPath}</code>, find
                  this site in the list, and set <strong>Local fonts</strong> to{" "}
                  <strong>Allow</strong>. Reload afterward.
                </Text>
              </VStack>

              <Text color="secondary" type="supporting">
                Local font picking only works in Chromium browsers ({browser} /
                Edge). You can always upload a font file instead.
              </Text>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <Button
              label="Got it"
              onClick={() => onOpenChange(false)}
              variant="primary"
            />
          </LayoutFooter>
        }
        header={
          <DialogHeader
            onOpenChange={onOpenChange}
            subtitle="The browser won't ask again after you block access."
            title="Enable local font access"
          />
        }
      />
    </Dialog>
  );
}

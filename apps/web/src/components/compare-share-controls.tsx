"use client";

import { Button } from "@astryxdesign/core/Button";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { buildCompareShareUrl, createCompareSession } from "@/lib/api";

function bufferToFontFile(buffer: ArrayBuffer, name: string): File {
  return new File([buffer], name, { type: "application/octet-stream" });
}

export function CompareShareControls({
  canShare,
  fontA,
  fontB,
  fontSize,
}: {
  canShare: boolean;
  fontA: { buffer: ArrayBuffer; file: File | null; fileName: string } | null;
  fontB: { buffer: ArrayBuffer; file: File | null; fileName: string } | null;
  fontSize: number;
}) {
  const t = useTranslations("compare.share");
  const locale = useLocale();
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!(fontA && fontB) || isSharing) {
      return;
    }

    setIsSharing(true);
    setCopied(false);
    setShareUrl(null);
    setErrorMessage(null);

    try {
      const form = new FormData();
      form.append(
        "fontA",
        fontA.file ?? bufferToFontFile(fontA.buffer, fontA.fileName)
      );
      form.append(
        "fontB",
        fontB.file ?? bufferToFontFile(fontB.buffer, fontB.fileName)
      );
      form.append("fontSize", String(Math.round(fontSize)));

      const session = await createCompareSession(form);
      const url = buildCompareShareUrl(locale, session.id);
      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        // Upload succeeded — surface the URL so the user can copy manually.
        setCopied(false);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsSharing(false);
    }
  }, [fontA, fontB, fontSize, isSharing, locale, t]);

  return (
    <VStack gap={2}>
      <HStack gap={3} style={{ alignItems: "center" }} wrap="wrap">
        <Button
          clickAction={handleShare}
          isDisabled={!canShare || isSharing}
          isLoading={isSharing}
          label={isSharing ? t("sharing") : t("button")}
          size="sm"
          variant="secondary"
        />
        {copied ? (
          <Text color="secondary" type="supporting">
            {t("copied")}
          </Text>
        ) : null}
        {shareUrl && !copied ? (
          <Text color="secondary" type="supporting">
            {t("copyManual", { url: shareUrl })}
          </Text>
        ) : null}
        {errorMessage ? (
          <Text color="accent" type="supporting">
            {errorMessage}
          </Text>
        ) : null}
      </HStack>
      <Text color="secondary" type="supporting">
        {canShare ? t("hint") : t("disabledHint")}
      </Text>
    </VStack>
  );
}

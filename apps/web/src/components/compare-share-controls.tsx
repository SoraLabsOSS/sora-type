"use client";

import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { InputGroup } from "@astryxdesign/core/InputGroup";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
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
      setShareUrl(buildCompareShareUrl(locale, session.id));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsSharing(false);
    }
  }, [fontA, fontB, fontSize, isSharing, locale, t]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

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
        {errorMessage ? (
          <Text color="accent" type="supporting">
            {errorMessage}
          </Text>
        ) : null}
      </HStack>

      {shareUrl ? (
        <InputGroup isLabelHidden label={t("linkLabel")} size="sm">
          <TextInput
            isLabelHidden
            label={t("linkLabel")}
            onChange={() => {
              // Display-only: reverting keeps the field acting read-only.
            }}
            value={shareUrl}
          />
          <IconButton
            icon={<Icon color="inherit" icon={copied ? "check" : "copy"} />}
            label={t("copyButton")}
            onClick={handleCopy}
            tooltip={copied ? t("copied") : t("copyButton")}
          />
        </InputGroup>
      ) : null}

      <Text color="secondary" type="supporting">
        {canShare ? t("hint") : t("disabledHint")}
      </Text>
    </VStack>
  );
}

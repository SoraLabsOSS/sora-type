"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  type CompareSession,
  getApiBaseUrl,
  sessionFontUrl,
  sessionUrl,
} from "@/lib/api";
import { fetchArrayBuffer, type HttpError } from "@/lib/fetcher";

type Slot = "left" | "right";

export function useSharedCompareSession({
  loadFontIntoSlot,
  run,
  setLeftSize,
  setRightSize,
  setSyncSliders,
}: {
  loadFontIntoSlot: (
    slot: Slot,
    isCurrent: () => boolean,
    fileName: string,
    buffer: ArrayBuffer,
    file: File | null
  ) => Promise<void>;
  run: (
    task: (isCurrent: () => boolean) => Promise<void>,
    key: Slot
  ) => Promise<void>;
  setLeftSize: (size: number) => void;
  setRightSize: (size: number) => void;
  setSyncSliders: (sync: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("s");
  const hydratedSessionRef = useRef<string | null>(null);
  const applyGenerationRef = useRef(0);
  const [isApplying, setIsApplying] = useState(false);

  const metaUrl = sessionId ? sessionUrl(sessionId) : null;
  const fontAUrl = sessionId ? sessionFontUrl(sessionId, "a") : null;
  const fontBUrl = sessionId ? sessionFontUrl(sessionId, "b") : null;

  const {
    data: sharedSession,
    error: sharedSessionError,
    isLoading: isSharedSessionLoading,
  } = useSWR<CompareSession>(metaUrl);

  const {
    data: fontABuffer,
    error: fontAError,
    isLoading: isFontALoading,
  } = useSWR(fontAUrl, fetchArrayBuffer);

  const {
    data: fontBBuffer,
    error: fontBError,
    isLoading: isFontBLoading,
  } = useSWR(fontBUrl, fetchArrayBuffer);

  const isHydrating =
    Boolean(sessionId) &&
    (isSharedSessionLoading || isFontALoading || isFontBLoading || isApplying);

  const failed =
    Boolean(sessionId) &&
    (!getApiBaseUrl() ||
      Boolean(sharedSessionError || fontAError || fontBError));

  const notFound = [sharedSessionError, fontAError, fontBError].some(
    (error: HttpError | undefined) => error?.status === 404
  );

  useEffect(() => {
    if (!(sessionId && sharedSession && fontABuffer && fontBBuffer)) {
      return;
    }
    if (hydratedSessionRef.current === sessionId) {
      return;
    }

    const generation = applyGenerationRef.current + 1;
    applyGenerationRef.current = generation;
    setIsApplying(true);

    const size = sharedSession.fontSize;
    setLeftSize(size);
    setRightSize(size);
    setSyncSliders(true);

    const isOwner = () => applyGenerationRef.current === generation;

    const applyFonts = async () => {
      try {
        await Promise.all([
          run(async (isCurrent) => {
            await loadFontIntoSlot(
              "left",
              isCurrent,
              "shared-a",
              fontABuffer,
              null
            );
          }, "left"),
          run(async (isCurrent) => {
            await loadFontIntoSlot(
              "right",
              isCurrent,
              "shared-b",
              fontBBuffer,
              null
            );
          }, "right"),
        ]);
        if (isOwner()) {
          hydratedSessionRef.current = sessionId;
        }
      } catch {
        // Slot state already records parse errors. Owner may retry on a
        // later effect if hydration was not marked complete.
      } finally {
        if (isOwner()) {
          setIsApplying(false);
        }
      }
    };

    applyFonts().catch(() => {
      // Errors handled inside applyFonts.
    });

    return () => {
      // Invalidate this run so its finally cannot clear a newer apply's UI.
      if (applyGenerationRef.current === generation) {
        applyGenerationRef.current = generation + 1;
        setIsApplying(false);
      }
    };
  }, [
    fontABuffer,
    fontBBuffer,
    loadFontIntoSlot,
    run,
    sessionId,
    setLeftSize,
    setRightSize,
    setSyncSliders,
    sharedSession,
  ]);

  return { failed, isHydrating, notFound };
}

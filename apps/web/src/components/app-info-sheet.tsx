"use client";

import { IconButton } from "@astryxdesign/core/IconButton";
import { Info } from "lucide-react";
import { useState } from "react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetList,
  BottomSheetPanel,
  BottomSheetRow,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/sora-ui/radix/bottom-sheet";
import { useRouter } from "@/i18n/navigation";
import { GITHUB_REPO_URL, PORTFOLIO_URL } from "@/lib/site";

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function AppInfoSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <BottomSheet onOpenChange={setOpen} open={open}>
      <BottomSheetTrigger asChild>
        <IconButton
          icon={<Info className="size-4" />}
          label="About Sora Type"
          tooltip="About"
          variant="ghost"
        />
      </BottomSheetTrigger>
      <BottomSheetContent
        className="max-w-[361px]"
        defaultSnap={0}
        showHandle={false}
        snapPoints={["auto"]}
      >
        <BottomSheetTitle>About Sora Type</BottomSheetTitle>
        <BottomSheetDescription>
          Credits, source code, privacy, and feedback links for Sora Type.
        </BottomSheetDescription>
        <BottomSheetPanel>
          <BottomSheetList>
            <BottomSheetRow
              label="What's inside"
              onClick={() => {
                setOpen(false);
                router.push("/about");
              }}
              value="→"
            />
            <BottomSheetRow
              label="Crafted by"
              onClick={() => {
                setOpen(false);
                openExternal(PORTFOLIO_URL);
              }}
              value="Axyl"
            />
            <BottomSheetRow
              label="Private by design"
              onClick={() => {
                setOpen(false);
                router.push("/privacy");
              }}
              value="→"
            />
            <BottomSheetRow
              label="View source code"
              onClick={() => {
                setOpen(false);
                openExternal(GITHUB_REPO_URL);
              }}
              value="GitHub"
            />
            <BottomSheetRow
              label="Report an issue"
              onClick={() => {
                setOpen(false);
                openExternal(`${GITHUB_REPO_URL}/issues`);
              }}
              value="GitHub"
            />
          </BottomSheetList>
        </BottomSheetPanel>
      </BottomSheetContent>
    </BottomSheet>
  );
}

import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import type { ReactNode } from "react";
import { InspectorFileInputShell } from "@/components/font-inspector-upload";
import { Skeleton, SkeletonButton } from "@/components/ui/skeleton";

const GLYPH_SKELETON_KEYS = [
  "sk-g01",
  "sk-g02",
  "sk-g03",
  "sk-g04",
  "sk-g05",
  "sk-g06",
  "sk-g07",
  "sk-g08",
  "sk-g09",
  "sk-g10",
  "sk-g11",
  "sk-g12",
  "sk-g13",
  "sk-g14",
  "sk-g15",
  "sk-g16",
  "sk-g17",
  "sk-g18",
  "sk-g19",
  "sk-g20",
  "sk-g21",
  "sk-g22",
  "sk-g23",
  "sk-g24",
  "sk-g25",
  "sk-g26",
  "sk-g27",
  "sk-g28",
] as const;

const DETAIL_SKELETON_KEYS = [
  "sk-detail-1",
  "sk-detail-2",
  "sk-detail-3",
  "sk-detail-4",
  "sk-detail-5",
  "sk-detail-6",
] as const;

const TECHNICAL_ROW_KEYS = [
  "sk-tech-1",
  "sk-tech-2",
  "sk-tech-3",
  "sk-tech-4",
] as const;

const skeletonHeights = {
  body: "calc(var(--text-body-size) * var(--text-body-leading))",
  heading2: "calc(var(--text-heading-2-size) * var(--text-heading-2-leading))",
  heading3: "calc(var(--text-heading-3-size) * var(--text-heading-3-leading))",
  heading4: "calc(var(--text-heading-4-size) * var(--text-heading-4-leading))",
  supporting:
    "calc(var(--text-supporting-size) * var(--text-supporting-leading))",
} as const;

function SkeletonCard({ children }: { children: ReactNode }) {
  return (
    <Card className="bg-surface" padding={4}>
      {children}
    </Card>
  );
}

function DetailRowSkeleton({ keyId }: { keyId: string }) {
  return (
    <HStack
      gap={3}
      key={keyId}
      style={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Skeleton
        className="w-28"
        rounded="sm"
        style={{ height: skeletonHeights.supporting }}
      />
      <Skeleton
        className="w-32 max-w-[55%]"
        rounded="sm"
        style={{ height: skeletonHeights.body }}
      />
    </HStack>
  );
}

export function GlyphGridSkeleton({
  cellMinWidth = 100,
}: {
  cellMinWidth?: number;
}) {
  return (
    <Grid columns={{ minWidth: cellMinWidth, repeat: "fill" }} gap={0}>
      {GLYPH_SKELETON_KEYS.map((key) => (
        <Skeleton
          className="aspect-square h-auto w-full"
          key={key}
          rounded="none"
        />
      ))}
    </Grid>
  );
}

export function GlyphsHeadingSkeleton() {
  return (
    <Skeleton
      className="w-40 max-w-full"
      rounded="sm"
      style={{ height: skeletonHeights.heading3 }}
    />
  );
}

export function GlyphsSectionSkeleton({
  cellMinWidth = 64,
}: {
  cellMinWidth?: number;
}) {
  return (
    <VStack gap={2}>
      <GlyphsHeadingSkeleton />
      <Skeleton
        className="w-full max-w-md"
        rounded="sm"
        style={{ height: skeletonHeights.supporting }}
      />
      <GlyphGridSkeleton cellMinWidth={cellMinWidth} />
    </VStack>
  );
}

export function PreviewSkeleton() {
  return (
    <Skeleton className="w-full" rounded="md" style={{ height: "8.5rem" }} />
  );
}

export function PreviewCardSkeleton() {
  return (
    <Card className="min-w-0 bg-surface" padding={4}>
      <VStack gap={3}>
        <Skeleton
          className="w-32 max-w-full"
          rounded="sm"
          style={{ height: skeletonHeights.heading3 }}
        />
        <VStack gap={2}>
          <HStack
            gap={3}
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Skeleton
              className="w-20"
              rounded="sm"
              style={{ height: skeletonHeights.supporting }}
            />
            <Skeleton
              className="w-10"
              rounded="sm"
              style={{ height: skeletonHeights.supporting }}
            />
          </HStack>
          <Skeleton className="h-2 w-full" rounded="full" />
        </VStack>
        <PreviewSkeleton />
      </VStack>
    </Card>
  );
}

export function SidebarSkeleton() {
  return (
    <VStack className="w-full" gap={4}>
      <SkeletonCard>
        <VStack gap={3}>
          <Skeleton
            className="w-full max-w-[180px]"
            rounded="sm"
            style={{ height: skeletonHeights.heading4 }}
          />
          <Skeleton
            className="w-28"
            rounded="sm"
            style={{ height: skeletonHeights.heading2 }}
          />
          <HStack gap={2} style={{ flexWrap: "wrap" }}>
            <Skeleton className="w-14" rounded="full" style={{ height: 24 }} />
            <Skeleton className="w-16" rounded="full" style={{ height: 24 }} />
            <Skeleton className="w-20" rounded="full" style={{ height: 24 }} />
          </HStack>
        </VStack>
      </SkeletonCard>

      <SkeletonCard>
        <VStack gap={3}>
          <Skeleton
            className="w-20"
            rounded="sm"
            style={{ height: skeletonHeights.supporting }}
          />
          <VStack gap={2}>
            {DETAIL_SKELETON_KEYS.map((key) => (
              <DetailRowSkeleton key={key} keyId={key} />
            ))}
          </VStack>
        </VStack>
      </SkeletonCard>
    </VStack>
  );
}

export function SummaryPanelSkeleton() {
  return (
    <VStack className="w-full" gap={4}>
      <SkeletonCard>
        <Skeleton
          className="w-full max-w-xs"
          rounded="sm"
          style={{ height: skeletonHeights.body }}
        />
      </SkeletonCard>
      <SkeletonCard>
        <VStack gap={2}>
          <Skeleton
            className="w-20"
            rounded="sm"
            style={{ height: skeletonHeights.supporting }}
          />
          {TECHNICAL_ROW_KEYS.map((key, index) => (
            <VStack gap={2} key={key}>
              {index > 0 ? (
                <Skeleton className="h-px w-full" rounded="none" />
              ) : null}
              <Skeleton
                className="w-full max-w-sm"
                rounded="sm"
                style={{ height: skeletonHeights.body }}
              />
            </VStack>
          ))}
        </VStack>
      </SkeletonCard>
    </VStack>
  );
}

const COLUMN_SCROLL_CLASS =
  "scrollbar-hidden min-h-0 lg:h-full lg:overflow-y-auto lg:overscroll-y-contain";

const INSPECTOR_GRID_CLASS =
  "grid grid-cols-1 gap-4 max-lg:min-h-min max-lg:flex-none lg:min-h-0 lg:flex-1 lg:h-full lg:grid-cols-[280px_minmax(0,1fr)_minmax(240px,280px)] lg:overflow-hidden";

export function DashboardLoadingShell() {
  return (
    <div className={INSPECTOR_GRID_CLASS}>
      <div className={`flex ${COLUMN_SCROLL_CLASS}`}>
        <SidebarSkeleton />
        <div className="mt-auto">
          <SkeletonButton />
        </div>
      </div>
      <div className={`flex flex-col gap-4 ${COLUMN_SCROLL_CLASS}`}>
        <InspectorFileInputShell isLoading />
        <PreviewCardSkeleton />
        <Card className="min-w-0 bg-surface" padding={4}>
          <VStack className="min-h-0" gap={3}>
            <GlyphsSectionSkeleton cellMinWidth={64} />
          </VStack>
        </Card>
      </div>
      <div className={`flex ${COLUMN_SCROLL_CLASS}`}>
        <SummaryPanelSkeleton />
      </div>
    </div>
  );
}

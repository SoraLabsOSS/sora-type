import { Grid } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
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

const SUMMARY_STAT_KEYS = [
  "sk-stat-full",
  "sk-stat-decomposed",
  "sk-stat-positioning",
  "sk-stat-none",
] as const;

const skeletonHeights = {
  body: "calc(var(--text-body-size) * var(--text-body-leading))",
  heading2: "calc(var(--text-heading-2-size) * var(--text-heading-2-leading))",
  heading3: "calc(var(--text-heading-3-size) * var(--text-heading-3-leading))",
  supporting:
    "calc(var(--text-supporting-size) * var(--text-supporting-leading))",
} as const;

export function GlyphGridSkeleton() {
  return (
    <Grid columns={{ minWidth: 100, repeat: "fill" }} gap={0}>
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

export function FontMetadataSkeleton() {
  return (
    <VStack gap={2}>
      <Skeleton
        className="w-full max-w-md"
        rounded="sm"
        style={{ height: skeletonHeights.supporting }}
      />
      <Skeleton
        className="w-52 max-w-full"
        rounded="sm"
        style={{ height: skeletonHeights.heading2 }}
      />
      <Skeleton
        className="w-72 max-w-full"
        rounded="sm"
        style={{ height: skeletonHeights.supporting }}
      />
      <SkeletonButton />
    </VStack>
  );
}

export function LanguageSummarySkeleton() {
  return (
    <HStack gap={4} style={{ flexWrap: "wrap" }}>
      {SUMMARY_STAT_KEYS.map((key) => (
        <HStack gap={1} key={key} style={{ alignItems: "center" }}>
          <Skeleton
            className="w-7"
            rounded="sm"
            style={{ height: skeletonHeights.body }}
          />
          <Skeleton
            className="w-24"
            rounded="sm"
            style={{ height: skeletonHeights.body }}
          />
        </HStack>
      ))}
    </HStack>
  );
}

export function LanguagesDetectedSkeleton() {
  return (
    <HStack gap={2} style={{ alignItems: "center" }}>
      <Text type="body">Support for</Text>
      <Skeleton
        className="w-8"
        rounded="sm"
        style={{ height: skeletonHeights.body }}
      />
      <Text type="body">languages detected</Text>
    </HStack>
  );
}

const DETAIL_SKELETON_KEYS = [
  "sk-detail-1",
  "sk-detail-2",
  "sk-detail-3",
  "sk-detail-4",
  "sk-detail-5",
  "sk-detail-6",
  "sk-detail-7",
  "sk-detail-8",
] as const;

export function FontDetailsSkeleton() {
  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Skeleton
          className="w-36 max-w-full"
          rounded="sm"
          style={{ height: skeletonHeights.heading3 }}
        />
        <VStack gap={2}>
          {DETAIL_SKELETON_KEYS.map((key) => (
            <HStack
              gap={3}
              key={key}
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Skeleton
                className="w-28"
                rounded="sm"
                style={{ height: skeletonHeights.supporting }}
              />
              <Skeleton
                className="w-40 max-w-[55%]"
                rounded="sm"
                style={{ height: skeletonHeights.body }}
              />
            </HStack>
          ))}
        </VStack>
      </VStack>

      <VStack gap={2}>
        <Skeleton
          className="w-full max-w-sm"
          rounded="sm"
          style={{ height: skeletonHeights.body }}
        />
        <Skeleton
          className="w-full max-w-xs"
          rounded="sm"
          style={{ height: skeletonHeights.body }}
        />
      </VStack>
    </VStack>
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

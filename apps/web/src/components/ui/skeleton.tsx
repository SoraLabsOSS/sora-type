"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const componentThemeClassName =
  "[--sk-muted:var(--color-skeleton,var(--muted,#f5f7fa))] [--sk-foreground:var(--color-text-primary,var(--foreground,#111111))]";

const STYLE_ID = "sk-styles";

const SKELETON_CSS = `
@keyframes sk-shimmer {
  to {
    transform: translateX(200%);
  }
}

.sk-surface {
  background-color: var(--sk-muted);
}

.sk-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--sk-foreground) 6%, transparent) 50%,
    transparent 100%
  );
  animation: sk-shimmer var(--sk-duration, 1.6s) ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sk-shimmer {
    animation: none;
  }
}
`;

type SkeletonRounded = "none" | "sm" | "md" | "lg" | "full";
type SkeletonVariant = "shimmer" | "fade";

const skeletonRoundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const satisfies Record<SkeletonRounded, string>;

const skeletonVariantDefaultDuration: Record<SkeletonVariant, number> = {
  shimmer: 1.6,
  fade: 2.4,
};

function ensureSkeletonStyles() {
  if (typeof document === "undefined") {
    return;
  }

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = SKELETON_CSS;
}

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  animate?: boolean;
  duration?: number;
  ref?: Ref<HTMLDivElement>;
  rounded?: SkeletonRounded;
  variant?: SkeletonVariant;
}

function Skeleton({
  animate = true,
  className,
  duration,
  ref,
  rounded = "md",
  style,
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  const variantDuration = duration ?? skeletonVariantDefaultDuration[variant];
  const showShimmer = animate && variant === "shimmer";
  const showFade = animate && variant === "fade";

  useEffect(() => {
    if (showShimmer) {
      ensureSkeletonStyles();
    }
  }, [showShimmer]);

  let animatedStyle = style;
  if (showShimmer) {
    animatedStyle = {
      ...style,
      "--sk-duration": `${variantDuration}s`,
    } as CSSProperties;
  } else if (showFade) {
    animatedStyle = { ...style, animationDuration: `${variantDuration}s` };
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        componentThemeClassName,
        "sk-surface relative block h-4 w-full overflow-hidden",
        showFade && "animate-pulse motion-reduce:animate-none",
        skeletonRoundedClasses[rounded],
        className
      )}
      ref={ref}
      style={animatedStyle}
      {...props}
    >
      {showShimmer ? (
        <span
          aria-hidden="true"
          className="sk-shimmer pointer-events-none absolute inset-0 -translate-x-full"
        />
      ) : null}
    </div>
  );
}

function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-3", className)} {...props} />;
}

function SkeletonButton({
  className,
  ...props
}: Omit<SkeletonProps, "rounded">) {
  return (
    <Skeleton
      className={cn("w-36", className)}
      rounded="lg"
      style={{ height: "var(--size-element-md, 2.25rem)" }}
      {...props}
    />
  );
}

type SkeletonTransitionPhase = "done" | "loading" | "revealing" | "settling";

const SKELETON_TRANSITION_DEFAULT_SETTLE_DURATION = 0.5;
const SKELETON_TRANSITION_DEFAULT_FADE_DURATION = 0.45;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface SkeletonTransitionProps {
  children: ReactNode;
  className?: string;
  fadeDuration?: number;
  loading: boolean;
  settleDuration?: number;
  skeleton: ReactNode;
}

function SkeletonTransition({
  children,
  className,
  fadeDuration = SKELETON_TRANSITION_DEFAULT_FADE_DURATION,
  loading,
  settleDuration = SKELETON_TRANSITION_DEFAULT_SETTLE_DURATION,
  skeleton,
}: SkeletonTransitionProps) {
  const [phase, setPhase] = useState<SkeletonTransitionPhase>(
    loading ? "loading" : "done"
  );

  useEffect(() => {
    if (loading) {
      setPhase("loading");
      return;
    }
    setPhase(prefersReducedMotion() ? "done" : "settling");
  }, [loading]);

  useEffect(() => {
    if (phase !== "settling") {
      return;
    }
    const timer = window.setTimeout(
      () => setPhase("revealing"),
      settleDuration * 1000
    );
    return () => window.clearTimeout(timer);
  }, [phase, settleDuration]);

  useEffect(() => {
    if (phase !== "revealing") {
      return;
    }
    const timer = window.setTimeout(
      () => setPhase("done"),
      fadeDuration * 1000
    );
    return () => window.clearTimeout(timer);
  }, [phase, fadeDuration]);

  const showSkeleton = phase !== "done";
  const showContent = phase !== "loading";
  const crossfading = phase === "revealing" || phase === "done";
  const fadeStyle: CSSProperties = { transitionDuration: `${fadeDuration}s` };

  return (
    <div className={cn("relative", className)}>
      {showSkeleton ? (
        <div
          aria-hidden="true"
          className={cn(
            "transition-opacity ease-out",
            crossfading ? "pointer-events-none opacity-0" : "opacity-100"
          )}
          style={fadeStyle}
        >
          {skeleton}
        </div>
      ) : null}
      {showContent ? (
        <div
          className={cn(
            showSkeleton && "absolute inset-0",
            "transition-opacity ease-out",
            crossfading ? "opacity-100" : "opacity-0"
          )}
          style={fadeStyle}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export type { SkeletonTransitionProps };
export {
  SKELETON_TRANSITION_DEFAULT_FADE_DURATION,
  SKELETON_TRANSITION_DEFAULT_SETTLE_DURATION,
  Skeleton,
  SkeletonButton,
  SkeletonText,
  SkeletonTransition,
};
